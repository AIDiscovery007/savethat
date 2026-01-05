/**
 * 滑雪动作分析 API 路由
 * 使用 Gemini Files API 处理大视频文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, createPartFromUri, createUserContent, ThinkingLevel } from '@google/genai';
import { getSkiAnalysisPrompt } from '@/lib/prompts/ski-analysis/system-prompts';

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
    } catch (error) {
      // 如果获取失败，尝试继续（可能 aihubmix 不完全支持此操作）
      console.warn(`[Ski Analysis] Failed to get file state, attempt ${attempt + 1}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
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

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const mimeType = file.type ?? 'video/mp4';
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid video format. Supported: MP4, WebM, MOV, AVI' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Video file too large. Maximum size: 2GB' },
        { status: 400 }
      );
    }

    // 创建 GenAI 客户端，配置超时和重试
    const client = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: { 
        baseUrl: GEMINI_ENDPOINT,
        // 增加超时时间以支持大文件上传
        timeout: 300000, // 5分钟
      },
    });

    // 准备分析提示词
    const analysisPrompt = prompt ?? getSkiAnalysisPrompt(
      level ?? undefined,
      jacketColor ?? undefined,
      pantsColor ?? undefined,
      helmetColor ?? undefined
    );

    console.log(`[Ski Analysis] Uploading video: ${file.name} (${file.size} bytes)`);
    const startTime = Date.now();

    // 将文件转换为 Blob 上传
    const fileBlob = new Blob([await file.arrayBuffer()], { type: mimeType });

    // 上传到 Gemini Files API（支持大文件）
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[Ski Analysis] Starting file upload (${fileSizeMB} MB)...`);
    console.log(`[Ski Analysis] Endpoint: ${GEMINI_ENDPOINT}, MIME type: ${mimeType}`);
    
    let uploadedFile;
    try {
      // 使用 Promise.race 添加超时保护
      const uploadPromise = client.files.upload({
        file: fileBlob,
        config: { mimeType, displayName: file.name },
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 4 minutes')), 4 * 60 * 1000);
      });
      
      uploadedFile = await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`[Ski Analysis] File upload successful: ${uploadedFile.uri}, name: ${uploadedFile.name}`);
    } catch (uploadError) {
      console.error('[Ski Analysis] File upload error details:', {
        error: uploadError,
        message: uploadError instanceof Error ? uploadError.message : String(uploadError),
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        fileSize: file.size,
        fileName: file.name,
        mimeType,
      });
      
      // 提供更详细的错误信息
      if (uploadError instanceof Error) {
        const errorMessage = uploadError.message.toLowerCase();
        if (errorMessage.includes('fetch failed') || errorMessage.includes('network') || errorMessage.includes('econnreset')) {
          throw new Error(`File upload failed due to network error. The file (${fileSizeMB} MB) may be too large for the current connection. Please try again or use a smaller file.`);
        }
        if (errorMessage.includes('timeout')) {
          throw new Error(`File upload timed out. The file (${fileSizeMB} MB) is taking too long to upload. Please try a smaller file or check your network connection.`);
        }
        if (errorMessage.includes('413') || errorMessage.includes('payload too large')) {
          throw new Error('File is too large for upload. Maximum size is 2GB.');
        }
      }
      throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }
    
    // 确保 uploadedFile 已定义
    if (!uploadedFile) {
      throw new Error('File upload failed: no file returned');
    }

    console.log(`[Ski Analysis] File uploaded: ${uploadedFile.uri}, name: ${uploadedFile.name}`);

    // 尝试等待文件变为 ACTIVE 状态
    // 注意：aihubmix 可能不完全支持 files.get()，如果失败则使用延迟
    let isReady = false;
    try {
      isReady = await waitForFileActive(client, uploadedFile.name!);
    } catch {
      console.warn(`[Ski Analysis] File status check not supported, using delay fallback`);
    }

    if (!isReady) {
      // 如果无法检查状态，使用固定延迟等待文件处理
      console.log(`[Ski Analysis] Using fallback delay for file processing...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // 调用 Gemini API 分析视频
    const fileUri = uploadedFile.uri;
    if (!fileUri) {
      throw new Error('File upload failed: no URI returned');
    }
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: createUserContent([
        createPartFromUri(fileUri, mimeType),
        analysisPrompt,
      ]),
      config: {
        thinkingConfig: {
          includeThoughts: true, // 包含思考过程
          thinkingLevel: ThinkingLevel.HIGH, // 使用高级思考模式以获得更深入的分析
        },
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Ski Analysis] Completed in ${duration}ms`);

    // 清理上传的文件
    try {
      await client.files.delete({ name: uploadedFile.name! });
    } catch {
      // 忽略删除错误（48小时后自动删除）
    }

    // 处理 thinking 模式响应：区分思考内容和正式结果
    let resultText = '';
    let thinkingText = '';

    // 遍历响应中的 parts，区分思考内容和正式响应
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (!part.text) continue;
        
        // 检查是否是思考内容
        if (part.thought === true) {
          thinkingText += part.text + '\n';
        } else {
          resultText += part.text;
        }
      }
    }

    // 如果没有通过 parts 获取到内容，使用 response.text 作为后备
    if (!resultText && response.text) {
      resultText = response.text;
    }

    // 记录思考过程（用于调试）
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
        // 尝试直接解析整个文本为 JSON
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

    // 如果存在思考内容，添加到结果中（可选，用于调试或展示）
    if (thinkingText) {
      analysisResult._thinking = thinkingText.trim();
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
    description: 'AI-powered skiing technique analysis using Gemini Files API',
    endpoint: '/api/ski-analysis',
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      video: 'Video file (MP4, WebM, MOV, AVI, max 2GB)',
      level: 'Optional: beginner, intermediate, advanced',
      prompt: 'Optional: custom analysis prompt',
    },
    note: 'Large files are uploaded via Gemini Files API for optimal performance',
  });
}
