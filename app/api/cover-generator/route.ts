/**
 * 小红书封面生成 API 路由
 * 使用 Gemini 图像生成模型生成封面
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';
import type { TextPart, ImagePart } from 'ai';
import { getModel, isConfigured } from '@/lib/api/aihubmix/sdk-client';

// API 配置
export const runtime = 'nodejs';
export const maxDuration = 120; // 2分钟超时
export const dynamic = 'force-dynamic';

// 图像大小限制 (4MB)
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

// 允许的图片 MIME 类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 生成图片数量
const DEFAULT_NUM_IMAGES = 2;

// 错误类型映射
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string; status: number }> = [
  { pattern: /API key|authentication/i, message: 'Authentication failed. Please check your API key.', status: 401 },
  { pattern: /rate limit|quota/i, message: 'Rate limit exceeded. Please try again later.', status: 429 },
  { pattern: /timeout|deadline/i, message: 'Generation timed out. Please try again.', status: 504 },
];

/**
 * 处理 API 错误并返回标准化响应
 */
function handleApiError(error: Error): NextResponse {
  const errorMessage = error.message;

  for (const { pattern, message, status } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return NextResponse.json({ error: message }, { status });
    }
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  );
}

/**
 * 验证 base64 图像数据
 */
function validateBase64Image(base64: string): boolean {
  if (!base64 || base64.length === 0) return false;

  // 检查是否为有效的数据 URL 格式或纯 base64
  const dataUrlPattern = /^data:image\/(jpeg|png|webp|gif);base64,/;
  const isDataUrl = dataUrlPattern.test(base64);

  // 移除前缀获取纯 base64
  const cleanBase64 = isDataUrl ? base64.replace(dataUrlPattern, '') : base64;

  // 验证 base64 字符集
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(cleanBase64)) return false;

  // 估算大小 (base64 编码会增加约 33%)
  const estimatedBytes = (cleanBase64.length * 3) / 4;
  return estimatedBytes <= MAX_IMAGE_SIZE;
}

/**
 * 解析 base64 图像
 */
function parseBase64Image(base64: string): { mimeType: string; data: Buffer } {
  const dataUrlPattern = /^data:image\/(jpeg|png|webp|gif);base64,/;
  const match = base64.match(dataUrlPattern);

  if (match) {
    // 数据 URL 格式
    const mimeType = match[1];
    const data = Buffer.from(base64.replace(dataUrlPattern, ''), 'base64');
    return { mimeType: `image/${mimeType}`, data };
  } else {
    // 纯 base64，默认为 JPEG
    const data = Buffer.from(base64, 'base64');
    // 检测实际类型
    const mimeType = detectMimeType(data);
    return { mimeType, data };
  }
}

/**
 * 检测图像的 MIME 类型
 */
function detectMimeType(buffer: Buffer): string {
  // 检查文件头
  if (buffer.length >= 4) {
    const header = buffer.slice(0, 4);
    const hex = header.toString('hex');

    // JPEG: FF D8 FF
    if (hex.startsWith('ffd8ff')) return 'image/jpeg';
    // PNG: 89 50 4E 47
    if (hex.startsWith('89504e47')) return 'image/png';
    // WebP: 52 49 46 46 (RIFF) + WebP 标识
    if (hex.startsWith('52494646') && buffer.length >= 12) {
      const webpHeader = buffer.slice(8, 12).toString('ascii');
      if (webpHeader === 'WEBP') return 'image/webp';
    }
    // GIF: 47 49 46 38
    if (hex.startsWith('47494638')) return 'image/gif';
  }

  return 'image/jpeg'; // 默认
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 检查 API 配置
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'API key not configured. Please set AIHUBMIX_API_KEY environment variable.' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { images, prompt } = body;

    // 验证提示词 (参考图片现在是可选的)
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a prompt describing the cover you want.' },
        { status: 400 }
      );
    }

    // 验证参考图片 (如果有的话)
    const validImages = (images || []).filter(
      (img: { base64?: string }) => img?.base64 && typeof img.base64 === 'string'
    );

    for (const img of validImages) {
      if (!validateBase64Image(img.base64)) {
        return NextResponse.json(
          { error: 'Image too large. Maximum size is 4MB per image.' },
          { status: 400 }
        );
      }
    }

    // 使用 aihubmix 的 Gemini 图像生成模型
    const model = getModel('gemini-3-pro-image-preview');

    // 构建内容 - 使用 AI SDK 的多模态格式
    const contentParts: Array<TextPart | ImagePart> = [];

    // 添加参考图片 (如果有)
    for (const img of validImages) {
      const { mimeType, data } = parseBase64Image(img.base64);
      contentParts.push({
        type: 'image',
        image: data,
        mediaType: mimeType,
      });
    }

    // 添加提示词
    contentParts.push({
      type: 'text',
      text: prompt,
    });

    // 调用图像生成 API
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
      temperature: 0.8,
      maxOutputTokens: 65536,
    });

    // 处理生成结果
    const covers: Array<{ id: string; url: string; prompt: string }> = [];

    if (result.files && result.files.length > 0) {
      for (const file of result.files) {
        if (file.mediaType && file.mediaType.startsWith('image/')) {
          // 转换为 data URL
          const base64 = Buffer.from(file.uint8Array).toString('base64');
          const dataUrl = `data:${file.mediaType};base64,${base64}`;

          covers.push({
            id: `${Date.now()}-${randomUUID()}`,
            url: dataUrl,
            prompt,
          });
        }
      }
    }

    // 如果没有生成图片，返回错误
    if (covers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate images. Please try again with a different prompt.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      covers,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Cover generation error:', error);

    if (error instanceof Error) {
      return handleApiError(error);
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
