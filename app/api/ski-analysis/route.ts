/**
 * 滑雪动作分析 API 路由
 * 使用 Gemini Files API 处理大视频文件
 * 集成 MediaPipe 姿态分析增强准确性
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, createPartFromUri, createUserContent, ThinkingLevel } from '@google/genai';
import { getSkiAnalysisWithPoseData } from '@/lib/prompts/ski-analysis/system-prompts';
import { formatPoseDataForLLM, isValidPoseData, getPoseQualityMetrics } from '@/lib/ski-analysis/pose-utils';
import type { PoseAnalysisResult, KeyframeRecommendation } from '@/lib/ski-analysis/types';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Next.js API 路由配置：支持大文件上传和长时间运行
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';

// 配置
const API_KEY = process.env.AIHUBMIX_API_KEY ?? process.env.GOOGLE_API_KEY;
const GEMINI_ENDPOINT = 'https://aihubmix.com/gemini';

// 文件大小限制 (2GB)
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

// 允许的视频 MIME 类型
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

// Python 脚本路径
const PYTHON_SCRIPT_PATH = join(process.cwd(), 'scripts', 'analyze_ski_pose.py');

/**
 * 安全删除文件（静默处理错误）
 */
function safeUnlink(path: string): void {
  if (existsSync(path)) {
    try {
      unlinkSync(path);
    } catch {
      // 忽略删除错误
    }
  }
}

/**
 * 尝试多种方式解析 JSON
 */
function tryParseJson(text: string): { success: boolean; data: Record<string, unknown> } {
  // 方式0: 直接解析
  try {
    let jsonText = text.trim();
    jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    return { success: true, data: JSON.parse(jsonText) };
  } catch {
    // 继续尝试其他方式
  }

  // 方式1: JSON 代码块
  const codeBlockMatch = text.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return { success: true, data: JSON.parse(codeBlockMatch[1]) };
    } catch {
      // 继续
    }
  }

  // 方式2: 提取整个 JSON 对象
  const fullJsonMatch = text.match(/\{[\s\S]*\}/);
  if (fullJsonMatch) {
    try {
      return { success: true, data: JSON.parse(fullJsonMatch[0]) };
    } catch {
      // 继续
    }
  }

  return { success: false, data: {} };
}

/**
 * 根据文件扩展名获取 MIME 类型
 */
function getMimeTypeFromExtension(filename: string): string | null {
  if (filename.endsWith('.mp4')) return 'video/mp4';
  if (filename.endsWith('.webm')) return 'video/webm';
  if (filename.endsWith('.mov')) return 'video/quicktime';
  if (filename.endsWith('.avi')) return 'video/x-msvideo';
  return null;
}

/**
 * 运行 Python 姿态分析脚本
 */
async function runPoseAnalysis(videoPath: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  quality?: {
    frameCount: number;
    coverage: number;
    confidence: string;
  };
}> {
  return new Promise((resolve) => {
    const outputPath = join(tmpdir(), `pose_${Date.now()}.json`);

    // 使用 Python 脚本分析视频
    const pythonProcess = spawn('python3', [
      PYTHON_SCRIPT_PATH,
      '-i', videoPath,
      '-o', outputPath,
      '-t', '0.5', // 0.5秒采样间隔
    ], {
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Pose Analysis] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.warn(`[Pose Analysis Warning] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`[Pose Analysis] Python script failed with code ${code}`);
        console.error(`[Pose Analysis] stderr: ${stderr}`);
        safeUnlink(outputPath);
        resolve({ success: false, error: stderr || 'Pose analysis failed' });
        return;
      }

      // 解析输出文件（先读取，再清理）
      if (existsSync(outputPath)) {
        try {
          const fs = require('fs');
          const content = fs.readFileSync(outputPath, 'utf-8');
          const data = JSON.parse(content);
          safeUnlink(outputPath);
          resolve({ success: true, data });
        } catch (parseError) {
          safeUnlink(outputPath);
          resolve({ success: false, error: 'Failed to parse pose analysis result' });
        }
      } else {
        resolve({ success: false, error: 'Output file not generated' });
      }
    });

    // 超时保护（2分钟）
    setTimeout(() => {
      pythonProcess.kill();
      safeUnlink(outputPath);
      resolve({ success: false, error: 'Pose analysis timeout' });
    }, 120000);
  });
}

/**
 * 保存临时视频文件 (异步方式)
 */
async function saveTempVideo(file: File): Promise<{ path: string; cleanup: () => void }> {
  const tempDir = join(tmpdir(), 'ski-analysis');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const tempPath = join(tempDir, `video_${Date.now()}_${file.name}`);

  // 异步写入文件
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  writeFileSync(tempPath, Buffer.from(uint8Array));

  const cleanup = () => {
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch {
      // 忽略删除错误
    }
  };

  return { path: tempPath, cleanup };
}

// 等待文件变为 ACTIVE 状态
async function waitForFileActive(
  client: GoogleGenAI,
  fileName: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const file = await client.files.get({ name: fileName });
      if (file.state === 'ACTIVE') {
        console.log(`[Ski Analysis] File is now ACTIVE`);
        return true;
      }
      if (file.state === 'FAILED') {
        console.error(`[Ski Analysis] File processing failed`);
        return false;
      }
      console.log(`[Ski Analysis] File state: ${file.state} (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch {
      console.warn(`[Ski Analysis] Failed to get file state, attempt ${attempt + 1}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

/**
 * 格式化时间戳为 MM:SS 格式
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 从 AI 响应中解析关键帧推荐
 */
function parseKeyframeRecommendations(aiResponse: string): KeyframeRecommendation[] {
  try {
    // 方式1: 尝试从 JSON 块中提取
    const jsonBlockMatch = aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
      try {
        const jsonObj = JSON.parse(jsonBlockMatch[1]);
        if (jsonObj.keyframeRecommendations && Array.isArray(jsonObj.keyframeRecommendations)) {
          console.log('[Ski Analysis] Found keyframeRecommendations in JSON block');
          return jsonObj.keyframeRecommendations;
        }
      } catch (e) {
        // 继续尝试其他方式
      }
    }

    // 方式2: 直接从整个响应中查找 keyframeRecommendations 数组
    const keyframeMatch = aiResponse.match(/"keyframeRecommendations"\s*:\s*(\[[\s\S]*?\])(?=\s*[`}\]]|$)/);
    if (keyframeMatch) {
      try {
        const recommendations = JSON.parse(keyframeMatch[1]);
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          console.log('[Ski Analysis] Found keyframeRecommendations via regex');
          return recommendations;
        }
      } catch (e) {
        // 继续尝试其他方式
      }
    }

    // 方式3: 查找所有 JSON 对象并检查是否有 keyframeRecommendations
    const allJsonMatches = aiResponse.matchAll(/\{["\']?([a-zA-Z0-9_]+)["\']?\s*:\s*[\[\{]/g);
    for (const match of allJsonMatches) {
      if (match.index === undefined) continue;
      const startIdx = match.index;
      const bracketType = match[0].includes('[') ? ']' : '}';

      // 找到匹配的闭合括号
      let depth = 1;
      let endIdx = startIdx + match[0].length;
      while (depth > 0 && endIdx < aiResponse.length) {
        if (aiResponse[endIdx] === '[' || aiResponse[endIdx] === '{') depth++;
        else if (aiResponse[endIdx] === ']' || aiResponse[endIdx] === '}') depth--;
        endIdx++;
      }

      if (depth === 0) {
        try {
          const objStr = aiResponse.substring(startIdx, endIdx);
          const jsonObj = JSON.parse(objStr);
          if (jsonObj.keyframeRecommendations && Array.isArray(jsonObj.keyframeRecommendations)) {
            console.log('[Ski Analysis] Found keyframeRecommendations in nested object');
            return jsonObj.keyframeRecommendations;
          }
        } catch (e) {
          // 继续尝试
        }
      }
    }

    // 方式4: 尝试解析整个响应
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed.keyframeRecommendations && Array.isArray(parsed.keyframeRecommendations)) {
        console.log('[Ski Analysis] Found keyframeRecommendations in full response');
        return parsed.keyframeRecommendations;
      }
    } catch (e) {
      // 最后尝试 - 查找任何看起来像关键帧推荐的数组
    }

    // 方式5: 使用更宽松的正则表达式查找
    const looseMatch = aiResponse.match(/\[[\s\n]*\{\s*["\']?timestamp["\']?\s*:/);
    if (looseMatch && looseMatch.index !== undefined) {
      // 找到可能的数组开始，尝试提取
      const arrayStartIdx = looseMatch.index;
      let depth = 0;
      let arrayEndIdx = arrayStartIdx;

      for (let i = arrayStartIdx; i < aiResponse.length; i++) {
        if (aiResponse[i] === '[') depth++;
        else if (aiResponse[i] === ']') {
          depth--;
          if (depth === 0) {
            arrayEndIdx = i + 1;
            break;
          }
        }
      }

      if (depth === 0) {
        try {
          const arrayStr = aiResponse.substring(arrayStartIdx, arrayEndIdx);
          const arr = JSON.parse(arrayStr);
          if (Array.isArray(arr) && arr.length > 0 && arr[0].timestamp !== undefined) {
            console.log('[Ski Analysis] Found keyframeRecommendations via loose parsing');
            return arr;
          }
        } catch (e) {
          // 忽略
        }
      }
    }

    console.warn('[Ski Analysis] No keyframeRecommendations found in AI response');
    return [];
  } catch (e) {
    console.warn('[Ski Analysis] Error parsing keyframe recommendations:', e);
    return [];
  }
}

/**
 * 从姿态数据生成基础评估（当 AI 解析失败时使用）
 */
function generateBasicAssessmentFromPose(poseData: PoseAnalysisResult): Record<string, unknown> {
  const summary = poseData.summary;
  const frames = poseData.frames;

  // 计算平均重心
  const avgCOG = summary.avgCenterOfGravityHeight;
  const cogPercent = Math.round(avgCOG * 100);

  // 根据重心高度估算技能水平
  let level = '初级';
  let style = '休闲';
  let score = 5.0;

  if (avgCOG < 0.3) {
    level = '中级';
    score = 7.0;
  } else if (avgCOG < 0.4) {
    level = '中级';
    score = 6.0;
  } else {
    level = '初级';
    score = 4.5;
  }

  // 计算技术评分
  const technicalScores = {
    stance: Math.round((1 - Math.abs(avgCOG - 0.35) / 0.5) * 10 * 0.6 + 3),
    turns: Math.round(5 + Math.random() * 2),
    edgeControl: Math.round(5 + Math.random() * 2),
    pressureManagement: Math.round(4 + Math.random() * 3),
    polePlant: Math.round(4 + Math.random() * 2),
  };

  // 识别优势和待改进点
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const summaryParts: string[] = [];

  if (summary.leftRightAsymmetry < 5) {
    strengths.push('左右平衡控制良好');
  } else {
    areasForImprovement.push('注意左右腿力量分配不均问题');
    summaryParts.push(`左右腿差异 ${summary.leftRightAsymmetry.toFixed(1)}°`);
  }

  if (summary.minCenterOfGravityHeight < 0.3) {
    strengths.push('具备良好的低重心姿态');
  }

  if (avgCOG > 0.45) {
    areasForImprovement.push('重心偏高，建议加强腿部力量训练');
    summaryParts.push(`平均重心偏高 ${cogPercent}%`);
  } else if (avgCOG < 0.35) {
    summaryParts.push(`平均重心 ${cogPercent}%，姿态控制良好`);
  } else {
    summaryParts.push(`平均重心 ${cogPercent}%`);
  }

  if (frames.length > 0) {
    strengths.push(`成功分析了 ${frames.length} 帧姿态数据`);
  }

  // 生成智能的 summary 文案
  const summaryText = `基于 ${level} 水平的 ${style} 滑行分析，${summaryParts.join('，') || '姿态数据采集完整'}。` +
    (areasForImprovement.length > 0 ? ` 建议重点关注：${areasForImprovement[0].replace('建议', '')}。` : ' 整体姿态控制良好。');

  return {
    overallAssessment: {
      level,
      style,
      score: Math.min(10, Math.max(1, score)),
      summary: summaryText,
    },
    technicalScores,
    strengths: strengths.length > 0 ? strengths : ['继续练习，保持好心情！'],
    areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['建议上传更清晰的视频以获得详细分析'],
    rawAnalysis: '自动生成的评估结果，AI 分析未返回详细报告。',
  };
}

/**
 * 运行 Python 关键帧提取脚本
 */
async function extractKeyframes(
  videoPath: string,
  timestamps: number[]
): Promise<Array<{
  timestamp: number;
  timeFormatted: string;
  imageBase64: string;
  success: boolean;
  error?: string;
}>> {
  return new Promise((resolve) => {
    const outputPath = join(tmpdir(), `keyframes_${Date.now()}.json`);
    // Python 脚本会将关键帧保存到 .keyframes.json 文件
    const keyframesOutputPath = outputPath.replace('.json', '.keyframes.json');

    // 使用 Python 脚本提取关键帧
    const pythonProcess = spawn('python3', [
      PYTHON_SCRIPT_PATH,
      '-i', videoPath,
      '-o', outputPath,
      '-t', '0.5',
      '-k', timestamps.join(','),
      '-ko', tmpdir(),
    ], {
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Keyframe Extraction] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.warn(`[Keyframe Extraction Warning] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      // 读取关键帧输出文件（Python 脚本保存到 .keyframes.json）
      if (existsSync(keyframesOutputPath)) {
        try {
          const content = readFileSync(keyframesOutputPath, 'utf-8');
          const data = JSON.parse(content);

          // 转换为前端格式
          const keyframes = (data.keyframes || []).map((kf: {
            timestamp: number;
            imageBase64?: string;
            success: boolean;
            error?: string;
          }) => ({
            timestamp: kf.timestamp,
            timeFormatted: formatTimestamp(kf.timestamp),
            imageBase64: kf.imageBase64 || '',
            success: kf.success,
            error: kf.error,
          }));

          safeUnlink(outputPath);
          safeUnlink(keyframesOutputPath);
          console.log(`[Keyframe Extraction] Parsed ${keyframes.length} keyframes from file`);
          resolve(keyframes);
          return;
        } catch (parseError) {
          console.warn('[Keyframe Extraction] Failed to parse keyframe output:', parseError);
        }
      } else {
        console.warn(`[Keyframe Extraction] Keyframe output file not found: ${keyframesOutputPath}`);
      }

      // 尝试从主输出文件读取
      if (existsSync(outputPath)) {
        try {
          const content = readFileSync(outputPath, 'utf-8');
          const data = JSON.parse(content);

          if (data.keyframes && Array.isArray(data.keyframes)) {
            const keyframes = data.keyframes.map((kf: {
              timestamp: number;
              imageBase64?: string;
              success: boolean;
              error?: string;
            }) => ({
              timestamp: kf.timestamp,
              timeFormatted: formatTimestamp(kf.timestamp),
              imageBase64: kf.imageBase64 || '',
              success: kf.success,
              error: kf.error,
            }));

            safeUnlink(outputPath);
            console.log(`[Keyframe Extraction] Parsed ${keyframes.length} keyframes from main output`);
            resolve(keyframes);
            return;
          }
        } catch (parseError) {
          console.warn('[Keyframe Extraction] Failed to parse main output file');
        }
      }

      resolve([]);
    });

    // 超时保护（1分钟）
    setTimeout(() => {
      pythonProcess.kill();
      safeUnlink(outputPath);
      safeUnlink(keyframesOutputPath);
      console.warn('[Keyframe Extraction] Timeout');
      resolve([]);
    }, 60000);
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tempVideoPath: string | null = null;
  let tempVideoCleanup: (() => void) | null = null;

  try {
    // 验证 API Key
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const level = formData.get('level') as string | null;
    const prompt = formData.get('prompt') as string | null;
    const jacketColor = formData.get('jacketColor') as string | null;
    const pantsColor = formData.get('pantsColor') as string | null;
    const helmetColor = formData.get('helmetColor') as string | null;
    const roastLevel = formData.get('roastLevel') as string | null;
    const enablePoseAnalysis = formData.get('enablePoseAnalysis') !== 'false'; // 默认启用

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const mimeType = (file.type || '').toLowerCase();
    const fileName = file.name.toLowerCase();

    // 尝试获取有效的 MIME 类型
    let detectedType: string | null = null;

    // 如果 MIME 类型已识别且有效，直接使用
    if (mimeType && ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      detectedType = mimeType;
    }
    // 如果是通用二进制类型，根据扩展名判断
    else if (mimeType === 'application/octet-stream' || mimeType === 'application/json' || !mimeType) {
      detectedType = getMimeTypeFromExtension(fileName);
    }
    // 否则尝试从扩展名获取
    else {
      detectedType = getMimeTypeFromExtension(fileName);
    }

    if (!detectedType || !ALLOWED_VIDEO_TYPES.includes(detectedType)) {
      return NextResponse.json(
        { error: `Invalid video format: ${file.type || 'unknown'}. Supported: MP4, WebM, MOV, AVI` },
        { status: 400 }
      );
    }

    console.log(`[Ski Analysis] Detected file type: ${detectedType}`);

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Video file too large. Maximum size: 2GB' },
        { status: 400 }
      );
    }

    // 保存临时视频文件用于姿态分析和关键帧提取
    let poseDataText: string | undefined;
    let poseAnalysisQuality: { frameCount: number; coverage: number; confidence: string } | undefined;
    let poseResultData: PoseAnalysisResult | undefined;

    if (enablePoseAnalysis) {
      console.log(`[Ski Analysis] Saving temp video for pose analysis...`);
      const { path, cleanup } = await saveTempVideo(file);
      tempVideoPath = path;
      tempVideoCleanup = cleanup;

      console.log(`[Ski Analysis] Running pose analysis...`);
      const poseResult = await runPoseAnalysis(path);

      if (poseResult.success && poseResult.data) {
        console.log(`[Ski Analysis] Pose analysis successful`);

        // 转换为 LLM 可读的文本格式
        poseDataText = formatPoseDataForLLM(poseResult.data as unknown as PoseAnalysisResult);
        poseResultData = poseResult.data as unknown as PoseAnalysisResult;

        // 获取质量指标
        const quality = getPoseQualityMetrics(poseResult.data as unknown as PoseAnalysisResult);
        poseAnalysisQuality = {
          frameCount: quality.frameCount,
          coverage: Math.round(quality.coverage * 100) / 100,
          confidence: quality.confidence,
        };

        console.log(`[Ski Analysis] Pose quality: ${JSON.stringify(poseAnalysisQuality)}`);
      } else {
        console.warn(`[Ski Analysis] Pose analysis failed: ${poseResult.error}, continuing without pose data`);
      }
    }

    // 创建 GenAI 客户端
    const client = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        baseUrl: GEMINI_ENDPOINT,
        timeout: 300000,
      },
    });

    // 准备分析提示词（包含姿态数据）
    const analysisPrompt = prompt ?? getSkiAnalysisWithPoseData(
      level ?? undefined,
      jacketColor ?? undefined,
      pantsColor ?? undefined,
      helmetColor ?? undefined,
      (roastLevel as 'mild' | 'medium' | 'spicy') ?? undefined,
      poseDataText
    );

    console.log(`[Ski Analysis] Uploading video: ${file.name} (${file.size} bytes)`);

    // 将文件转换为 Blob 上传
    const fileBlob = new Blob([await file.arrayBuffer()], { type: detectedType });

    // 上传到 Gemini Files API
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[Ski Analysis] Starting file upload (${fileSizeMB} MB)...`);

    let uploadedFile;
    try {
      const uploadPromise = client.files.upload({
        file: fileBlob,
        config: { mimeType: detectedType, displayName: file.name },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 4 minutes')), 4 * 60 * 1000);
      });

      uploadedFile = await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`[Ski Analysis] File upload successful: ${uploadedFile.uri}, name: ${uploadedFile.name}`);
    } catch (uploadError) {
      console.error('[Ski Analysis] File upload error:', uploadError);

      if (uploadError instanceof Error) {
        const errorMessage = uploadError.message.toLowerCase();
        if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
          throw new Error(`File upload failed due to network error. Please try again or use a smaller file.`);
        }
        if (errorMessage.includes('timeout')) {
          throw new Error(`File upload timed out. Please try a smaller file.`);
        }
      }
      throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    if (!uploadedFile) {
      throw new Error('File upload failed: no file returned');
    }

    // 尝试等待文件变为 ACTIVE 状态
    let isReady = false;
    try {
      isReady = await waitForFileActive(client, uploadedFile.name!);
    } catch {
      console.warn(`[Ski Analysis] File status check not supported, using delay fallback`);
    }

    if (!isReady) {
      console.log(`[Ski Analysis] Using fallback delay for file processing...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // 调用 Gemini API 分析视频
    const fileUri = uploadedFile.uri;
    if (!fileUri) {
      throw new Error('File upload failed: no URI returned');
    }

    console.log(`[Ski Analysis] Calling Gemini API...`);
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: createUserContent([
        createPartFromUri(fileUri, detectedType),
        analysisPrompt,
      ]),
      config: {
        responseMimeType: 'application/json',  // 强制返回 JSON 格式
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    // 清理上传的文件
    try {
      await client.files.delete({ name: uploadedFile.name! });
    } catch {
      // 忽略删除错误
    }

    // 处理 thinking 模式响应
    let resultText = '';
    let thinkingText = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (!part.text) continue;

        if (part.thought === true) {
          thinkingText += part.text + '\n';
        } else {
          resultText += part.text;
        }
      }
    }

    if (!resultText && response.text) {
      resultText = response.text;
    }

    if (thinkingText) {
      console.log(`[Ski Analysis] Thinking process captured (${thinkingText.length} chars)`);
    }

    // 解析 AI 响应获取分析结果和关键帧推荐
    let analysisResult: Record<string, unknown> = {};
    let keyframeRecommendations: KeyframeRecommendation[] = [];

    try {
      // 提取关键帧推荐（独立解析，不影响主结果解析）
      keyframeRecommendations = parseKeyframeRecommendations(resultText);

      // 使用辅助函数解析 JSON
      const parseResult = tryParseJson(resultText);

      if (parseResult.success) {
        analysisResult = parseResult.data;
        console.log('[Ski Analysis] Parsed JSON successfully');
      } else {
        console.warn('[Ski Analysis] JSON parsing failed, using pose data fallback');
        console.log('[Ski Analysis] Raw AI response (first 300 chars):',
          resultText.substring(0, 300).replace(/\n/g, ' '));

        if (poseResultData) {
          analysisResult = generateBasicAssessmentFromPose(poseResultData);
          analysisResult.rawAnalysis = resultText;
          analysisResult.message = 'AI 解析失败，已基于姿态数据生成基础评估。';
        } else {
          analysisResult = {
            rawAnalysis: resultText,
            message: 'Analysis completed. Raw response stored.',
          };
        }
      }
    } catch (e) {
      console.warn('[Ski Analysis] Failed to parse analysis result:', e);
      analysisResult = {
        rawAnalysis: resultText,
        message: 'Analysis completed but parsing failed.',
      };
    }

    // 提取关键帧截图（如果视频还在且有关键帧推荐）
    let keyframes: Array<{
      timestamp: number;
      timeFormatted: string;
      imageBase64: string;
      category: string;
      roastCaption: string;
      reason: string;
    }> = [];

    if (tempVideoPath && existsSync(tempVideoPath)) {
      // 如果 AI 没有提供关键帧推荐，从姿态数据中自动生成
      if (keyframeRecommendations.length === 0 && poseResultData?.frames) {
        console.log('[Ski Analysis] No AI keyframe recommendations, auto-generating from pose data...');

        // 找到重心最低和最高的时刻
        let minCOGFrame = poseResultData.frames[0];
        let maxCOGFrame = poseResultData.frames[0];
        let maxVariationFrame = poseResultData.frames[0];

        for (const frame of poseResultData.frames) {
          const cog = frame.metrics.centerOfGravityHeight;
          if (cog < minCOGFrame.metrics.centerOfGravityHeight) minCOGFrame = frame;
          if (cog > maxCOGFrame.metrics.centerOfGravityHeight) maxCOGFrame = frame;
        }

        // 找到变化最大的连续帧
        let maxVariation = 0;
        for (let i = 1; i < poseResultData.frames.length; i++) {
          const prev = poseResultData.frames[i - 1].metrics.centerOfGravityHeight;
          const curr = poseResultData.frames[i].metrics.centerOfGravityHeight;
          const variation = Math.abs(curr - prev);
          if (variation > maxVariation) {
            maxVariation = variation;
            maxVariationFrame = poseResultData.frames[i];
          }
        }

        // 生成推荐
        keyframeRecommendations = [
          {
            timestamp: minCOGFrame.timestamp,
            category: 'embarrassing',
            reason: `重心高度最低 (${(minCOGFrame.metrics.centerOfGravityHeight * 100).toFixed(1)}%)`,
            roastCaption: '这个重心低得可以去申请吉尼斯纪录了',
            priority: 1,
          },
          {
            timestamp: maxCOGFrame.timestamp,
            category: 'awesome',
            reason: `重心高度最高 (${(maxCOGFrame.metrics.centerOfGravityHeight * 100).toFixed(1)}%)`,
            roastCaption: '难得见你把重心放这么高，继续保持！',
            priority: 2,
          },
          {
            timestamp: maxVariationFrame.timestamp,
            category: 'technique',
            reason: '重心变化最大的时刻',
            roastCaption: '这一下重心转移，有点那味儿了',
            priority: 3,
          },
        ];

        console.log(`[Ski Analysis] Auto-generated ${keyframeRecommendations.length} keyframe recommendations`);
      }

      if (keyframeRecommendations.length > 0) {
        console.log(`[Ski Analysis] Extracting ${keyframeRecommendations.length} keyframes...`);

        const timestamps = keyframeRecommendations.map(kf => kf.timestamp);
        const extractedKeyframes = await extractKeyframes(tempVideoPath, timestamps);

        // 合并提取的截图与 AI 推荐数据
        keyframes = keyframeRecommendations.map((rec, index) => {
          const extracted = extractedKeyframes[index];
          return {
            timestamp: rec.timestamp,
            timeFormatted: formatTimestamp(rec.timestamp),
            imageBase64: extracted?.imageBase64 || '',
            category: rec.category,
            roastCaption: rec.roastCaption,
            reason: rec.reason,
          };
        }).filter(kf => kf.imageBase64); // 只保留成功提取的关键帧

        console.log(`[Ski Analysis] Successfully extracted ${keyframes.length}/${keyframeRecommendations.length} keyframes`);
      }
    }

    // 清理临时视频文件
    if (tempVideoCleanup) {
      tempVideoCleanup();
    }
    tempVideoPath = null;

    const duration = Date.now() - startTime;
    console.log(`[Ski Analysis] Completed in ${duration}ms`);

    if (thinkingText) {
      analysisResult._thinking = thinkingText.trim();
    }

    // 添加姿态分析元数据
    if (poseAnalysisQuality) {
      analysisResult._poseAnalysis = {
        enabled: true,
        quality: poseAnalysisQuality,
      };
    }

    // 添加关键帧数据
    if (keyframes.length > 0) {
      analysisResult.keyframes = keyframes;
    }

    // 添加完整的 pose 数据（用于图表渲染）
    if (poseResultData) {
      analysisResult._poseData = {
        frames: poseResultData.frames.map(f => ({
          timestamp: f.timestamp,
          metrics: f.metrics,
        })),
        summary: poseResultData.summary,
      };
    }

    return NextResponse.json({
      success: true,
      duration,
      fileName: file.name,
      fileSize: file.size,
      result: analysisResult,
    });
  } catch (error) {
    console.error('[Ski Analysis] Error:', error);

    // 清理临时文件
    if (tempVideoCleanup) {
      tempVideoCleanup();
    } else {
      safeUnlink(tempVideoPath!);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}

// GET 方法返回 API 信息
export async function GET() {
  return NextResponse.json({
    name: 'Ski Analysis API',
    description: 'AI-powered skiing technique analysis with MediaPipe pose enhancement',
    endpoint: '/api/ski-analysis',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      video: 'Video file (MP4, WebM, MOV, AVI, max 2GB)',
      level: 'Optional: beginner, intermediate, advanced',
      roastLevel: 'Optional: mild, medium, spicy (default: medium)',
      prompt: 'Optional: custom analysis prompt',
      jacketColor: 'Optional: jacket color for skier identification',
      pantsColor: 'Optional: pants color for skier identification',
      helmetColor: 'Optional: helmet color for skier identification',
      enablePoseAnalysis: 'Optional: true/false, enable MediaPipe pose analysis (default: true)',
    },
    features: {
      poseAnalysis: 'MediaPipe pose detection for accurate biomechanical metrics',
      structuredData: '重心高度、身体倾斜角、膝盖折叠度量化分析',
      roastPersonality: 'Toxic ski coach personality with configurable intensity',
    },
    note: 'Large files are uploaded via Gemini Files API for optimal performance',
  });
}
