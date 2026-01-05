/**
 * 滑雪动作分析 API 路由
 * 使用 Gemini Files API 处理大视频文件
 * 集成 MediaPipe 姿态分析增强准确性
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, createPartFromUri, createUserContent, ThinkingLevel } from '@google/genai';
import { getSkiAnalysisWithPoseData } from '@/lib/prompts/ski-analysis/system-prompts';
import { formatPoseDataForLLM, isValidPoseData, getPoseQualityMetrics } from '@/lib/ski-analysis/pose-utils';
import type { PoseAnalysisResult } from '@/lib/ski-analysis/types';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
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
        // 清理输出文件
        if (existsSync(outputPath)) {
          try {
            unlinkSync(outputPath);
          } catch {}
        }
        resolve({ success: false, error: stderr || 'Pose analysis failed' });
        return;
      }

      // 解析输出文件（先读取，再清理）
      if (existsSync(outputPath)) {
        try {
          const fs = require('fs');
          const content = fs.readFileSync(outputPath, 'utf-8');
          const data = JSON.parse(content);

          // 清理输出文件
          try {
            unlinkSync(outputPath);
          } catch {}

          resolve({ success: true, data });
        } catch (parseError) {
          // 清理输出文件
          if (existsSync(outputPath)) {
            try {
              unlinkSync(outputPath);
            } catch {}
          }
          resolve({ success: false, error: 'Failed to parse pose analysis result' });
        }
      } else {
        resolve({ success: false, error: 'Output file not generated' });
      }
    });

    // 超时保护（2分钟）
    setTimeout(() => {
      pythonProcess.kill();
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath);
        } catch {}
      }
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tempVideoPath: string | null = null;

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

    // 保存临时视频文件用于姿态分析
    let poseDataText: string | undefined;
    let poseAnalysisQuality: { frameCount: number; coverage: number; confidence: string } | undefined;

    if (enablePoseAnalysis) {
      console.log(`[Ski Analysis] Saving temp video for pose analysis...`);
      const { path, cleanup } = await saveTempVideo(file);
      tempVideoPath = path;

      console.log(`[Ski Analysis] Running pose analysis...`);
      const poseResult = await runPoseAnalysis(path);

      if (poseResult.success && poseResult.data) {
        console.log(`[Ski Analysis] Pose analysis successful`);

        // 转换为 LLM 可读的文本格式
        poseDataText = formatPoseDataForLLM(poseResult.data as unknown as PoseAnalysisResult);

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

      // 清理临时文件
      cleanup();
      tempVideoPath = null;
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
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Ski Analysis] Completed in ${duration}ms`);

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

    // 尝试解析 JSON
    let analysisResult;
    try {
      const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        try {
          analysisResult = JSON.parse(resultText);
        } catch {
          analysisResult = {
            rawAnalysis: resultText,
            message: 'Analysis completed. Raw response included.',
          };
        }
      }
    } catch {
      analysisResult = {
        rawAnalysis: resultText,
        message: 'Analysis completed but JSON parsing failed.',
      };
    }

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
    if (tempVideoPath && existsSync(tempVideoPath)) {
      try {
        unlinkSync(tempVideoPath);
      } catch {}
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
