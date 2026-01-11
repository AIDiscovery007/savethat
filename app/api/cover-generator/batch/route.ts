/**
 * 小红书封面批量生成 API 路由
 * AI 分析笔记内容，智能生成封面 + 多张内容页
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';
import type { ImagePart } from 'ai';
import { getModel, isConfigured, aihubmix } from '@/lib/api/aihubmix/sdk-client';
import { validateBase64Image, parseBase64Image } from '@/lib/utils/image';
import { getStyleById } from '@/app/[locale]/tools/cover-generator/config/styles';

// API 配置
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';

/**
 * 分析笔记内容，生成图片分工建议
 * 使用 aihubmix SDK 直接调用模型
 */
async function analyzeNoteContent(
  theme: string,
  content: string,
  styleId: string
): Promise<{
  suggestedImageCount: number;
  coverFocus: string;
  contentPages: Array<{ index: number; focus: string; layout: string }>;
  reasoning: string;
}> {
  const systemMsg = `你是一个小红书内容策划专家。你的任务是分析用户的笔记内容，判断需要多少张图片来承载，并说明每张图片的重点。

小红书笔记的图片角色：
- 首图（封面）：吸引点击，需要视觉冲击力
- 内容页：承载正文内容，展示细节、步骤、效果等

请根据内容复杂度合理判断图片数量：
- 简单分享（1-2个要点）：3-4张
- 中等内容（3-4个要点）：5-6张
- 详细教程（5+个要点）：7-9张

请用JSON格式返回分析结果，不要添加任何其他内容。`;

  const userMsg = `## 笔记主题
${theme}

## 笔记正文
${content}

## 风格ID
${styleId}

请分析并返回JSON格式：
{
  "suggestedImageCount": 数字（包含封面）,
  "coverFocus": "封面重点描述",
  "contentPages": [
    {"index": 1, "focus": "第2张图片重点", "layout": "建议布局"},
    {"index": 2, "focus": "第3张图片重点", "layout": "建议布局"}
    ...
  ],
  "reasoning": "为什么需要这么多图片的说明"
}`;

  try {
    // 使用 aihubmix SDK 直接调用模型
    const textModel = aihubmix('gemini-3-flash-preview-search');

    const result = await generateText({
      model: textModel,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.3,
      maxOutputTokens: 65536,
    });

    let contentStr = result.text || '';

    // 移除 markdown 代码块
    contentStr = contentStr.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(contentStr);
    return {
      suggestedImageCount: parsed.suggestedImageCount || 3,
      coverFocus: parsed.coverFocus || '吸引点击的视觉焦点',
      contentPages: parsed.contentPages || [],
      reasoning: parsed.reasoning || '根据内容分析自动推断',
    };
  } catch (error) {
    console.error('Content analysis error:', error);
    // 默认返回简单的分析结果
    return {
      suggestedImageCount: 3,
      coverFocus: '突出主题的视觉设计',
      contentPages: [
        { index: 1, focus: '内容要点展示', layout: '拼贴风格' },
        { index: 2, focus: '细节补充说明', layout: '上下结构' },
      ],
      reasoning: '使用默认配置生成，请根据需要调整',
    };
  }
}

/**
 * 生成单张图片
 */
async function generateSingleImage(
  prompt: string,
  images: Array<{ base64: string }>,
  customPrompt?: string
): Promise<{ id: string; url: string; prompt: string } | null> {
  const model = getModel('gemini-3-pro-image-preview');

  const contentParts: Array<ImagePart | { type: 'text'; text: string }> = [];

  // 添加参考图片
  for (const img of images) {
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
    text: customPrompt || prompt,
  });

  try {
    const result = await generateText({
      model,
      messages: [{ role: 'user', content: contentParts }],
      temperature: 0.8,
      maxOutputTokens: 65536,
    });

    if (result.files && result.files.length > 0) {
      const file = result.files[0];
      if (file.mediaType && file.mediaType.startsWith('image/')) {
        const base64 = Buffer.from(file.uint8Array).toString('base64');
        const dataUrl = `data:${file.mediaType};base64,${base64}`;

        return {
          id: `${Date.now()}-${randomUUID()}`,
          url: dataUrl,
          prompt: customPrompt || prompt,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Single image generation error:', error);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'API key not configured. Please set AIHUBMIX_API_KEY environment variable.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme, content, styleId, images } = body;

    // 验证必填字段
    if (!theme || typeof theme !== 'string') {
      return NextResponse.json(
        { error: '请提供笔记主题' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '请提供笔记内容' },
        { status: 400 }
      );
    }

    // 验证风格ID
    const validStyleId = styleId && typeof styleId === 'string' ? styleId : 'vibrant';
    const styleConfig = getStyleById(validStyleId);
    if (!styleConfig) {
      return NextResponse.json(
        { error: '无效的风格配置' },
        { status: 400 }
      );
    }

    // 验证参考图片
    const validImages = (images || []).filter(
      (img: { base64?: string }) => img?.base64 && typeof img.base64 === 'string'
    );

    for (const img of validImages) {
      if (!validateBase64Image(img.base64)) {
        return NextResponse.json(
          { error: '图片过大，最大支持10MB' },
          { status: 400 }
        );
      }
    }

    // 分析内容，确定图片数量和分工
    const analysis = await analyzeNoteContent(theme, content, validStyleId);

    // 构建基础提示词
    const basePrompt = `Create a high-quality Xiaohongshu style image with ${styleConfig.name} style.
Colors: ${styleConfig.colors.primary}, ${styleConfig.colors.secondary}
Mood: ${styleConfig.mood}
Aspect ratio: 3:4 (vertical)
Quality: 2K ultra-high definition (2048x2732px)
IMPORTANT: NO watermarks, NO logos, NO text labels, NO platform branding of any kind.
The image must be clean without any 小红书/Xiaohongshu logo or text marks.`;

    // 并行生成封面
    const coverPrompt = `${basePrompt}
${analysis.coverFocus}
Create an eye-catching cover image for Xiaohongshu platform with 3:4 vertical ratio, 2K quality, absolutely no watermarks or logos.`;

    const coverResult = await generateSingleImage(basePrompt, validImages, coverPrompt);

    if (!coverResult) {
      return NextResponse.json(
        { error: '封面生成失败' },
        { status: 500 }
      );
    }

    // 并行生成内容页
    const contentPagePromises = analysis.contentPages.map(async (page) => {
      const pagePrompt = `${basePrompt}
${page.focus}
Layout: ${page.layout}
Create a content page image for Xiaohongshu with 3:4 vertical ratio, 2K quality, absolutely no watermarks or logos.`;

      return generateSingleImage(basePrompt, validImages, pagePrompt);
    });

    const contentPageResults = await Promise.all(contentPagePromises);
    const contentPages = contentPageResults
      .filter((r): r is { id: string; url: string; prompt: string } => r !== null)
      .map((r, idx) => ({ ...r, prompt: analysis.contentPages[idx]?.focus || '' }));

    // 如果没有生成内容页，返回错误
    if (contentPages.length === 0) {
      return NextResponse.json(
        { error: '内容页生成失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cover: coverResult,
      contentPages,
      totalImages: 1 + contentPages.length,
      analysis,
    });
  } catch (error) {
    console.error('Batch generation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || '批量生成失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '批量生成失败，请重试' },
      { status: 500 }
    );
  }
}
