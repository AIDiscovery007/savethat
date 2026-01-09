/**
 * 小红书封面生成 API 路由
 * 使用 Gemini 图像生成模型生成封面
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';
import type { ImagePart } from 'ai';
import { getModel, isConfigured } from '@/lib/api/aihubmix/sdk-client';
import { validateBase64Image, parseBase64Image } from '@/lib/utils/image';

// API 配置
export const runtime = 'nodejs';
export const maxDuration = 120; // 2分钟超时
export const dynamic = 'force-dynamic';

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
    { error: errorMessage || 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  );
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
    const contentParts: Array<ImagePart | { type: 'text'; text: string }> = [];

    // 添加参考图片 (如果有)
    for (const img of validImages) {
      const { mimeType, data } = parseBase64Image(img.base64);
      contentParts.push({
        type: 'image',
        image: data,
        mediaType: mimeType,
      });
    }

    // 添加提示词（附加小红书规范要求）
    contentParts.push({
      type: 'text',
      text: `${prompt}

Additional requirements:
- Aspect ratio: 3:4 (vertical)
- Quality: 2K ultra-high definition (2048x2732px)
- IMPORTANT: NO watermarks, NO logos, NO text labels, NO platform branding of any kind
- Clean image without any 小红书/Xiaohongshu logo or text marks`,
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
