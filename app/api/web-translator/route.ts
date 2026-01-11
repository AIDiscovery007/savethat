/**
 * 网页翻译 API Route
 * 1. 使用 Firecrawl 抓取网页内容
 * 2. 使用 Gemini 智能提取正文,过滤噪音
 * 3. 使用 Gemini 翻译成中文
 */

import { NextRequest, NextResponse } from 'next/server';
import Firecrawl from '@mendable/firecrawl-js';
import { aihubmixClient } from '@/lib/api/aihubmix/client';
import type { AihubmixChatRequest } from '@/lib/api/aihubmix/types';

// 环境配置
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';

// Firecrawl 客户端初始化
const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

// 智能正文提取提示词 - 两层过滤机制
const EXTRACTION_PROMPT = `你是一个专业的网页内容分析专家。请从以下内容中提取核心正文,并**严格过滤**所有噪音内容。

【需要移除的内容 - 100% 过滤】:
- 导航链接: 首页、关于、联系我们、隐私政策、服务条款、Cookie 设置等
- 按钮文字: "返回"、"提交"、"了解更多"、"立即注册"、"订阅"等
- 页脚信息: 版权声明、联系方式、社交媒体链接
- 弹窗内容: Cookie 同意框、Newsletter 订阅弹窗、广告弹窗
- 侧边栏: 分类目录、标签云、热门推荐、广告
- 元信息: 作者、发布日期(除非是文章核心内容)
- 分享按钮: "分享到 Twitter/Facebook"等
- 评论区域(除非评论是文章核心)
- "相关推荐"、"猜你喜欢"等

【需要保留的内容】:
- 文章主标题
- 所有正文段落
- 正文中的图片及描述
- 正文章节标题(H1-H6)
- 正文中的列表、表格、引用、代码块

【输出要求】:
只输出处理后的纯净内容,**不要有任何解释说明**。保持 Markdown 格式完整。

原文内容:
{content}`;

// 翻译提示词 - 针对已提取的正文
const TRANSLATION_PROMPT = `你是一个专业翻译专家。任务是将以下**已提取的正文内容**润色翻译成中文。

要求:
1. **输入已过滤**: 内容已去除噪音,专注翻译核心正文
2. **润色翻译**: 不要直译,使中文地道自然
3. **保持结构**: 保留标题层级、段落、列表、代码块等格式
4. **图片保留**: 保持原图片链接在原文位置
5. **不要添加**: 不要添加原文中不存在的"阅读更多"等内容

原文语言: {language}

正文内容:
{content}`;

// 识别语言提示词
const LANGUAGE_DETECTION_PROMPT = `请识别以下文本的语言种类。只需要回复语言的**简短英文名称**即可,例如: English, Japanese, Spanish, Korean, French, German, Chinese, etc.

文本: {text}`;

interface ScrapeResult {
  title?: string;
  markdown?: string;
  html?: string;
}

interface TranslateResponse {
  success: boolean;
  data?: {
    originalTitle: string;
    originalLanguage: string;
    translatedTitle: string;
    translatedContent: string;
    images: Array<{ src: string; alt?: string }>;
    modelId: string;
    tokens: { prompt: number; completion: number; total: number };
  };
  error?: string;
}

/**
 * 验证 URL 格式
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 从 Markdown 中提取图片信息
 */
function extractImages(markdown: string): Array<{ src: string; alt?: string }> {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Array<{ src: string; alt?: string }> = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || undefined,
      src: match[2],
    });
  }

  return images;
}

/**
 * 从标题中提取翻译后的标题
 */
function extractTranslatedTitle(content: string): string {
  // 尝试匹配 # 开头的主标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  // 如果没有 Markdown 标题,取第一行作为标题
  const lines = content.trim().split('\n');
  if (lines.length > 0) {
    return lines[0].replace(/^#+\s+/, '').trim();
  }
  return '';
}

/**
 * 智能提取并精滤正文内容 - 第二层过滤
 */
async function extractMainContent(content: string): Promise<string> {
  const prompt = EXTRACTION_PROMPT.replace('{content}', content);

  const response = await aihubmixClient.chat({
    model: 'gemini-3-flash-preview',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 65536,
    temperature: 0.1, // 低温度,更精确
  });

  return response.choices[0]?.message.content.trim() || content;
}

/**
 * 检测文本语言
 */
async function detectLanguage(text: string): Promise<string> {
  const prompt = LANGUAGE_DETECTION_PROMPT.replace('{text}', text.slice(0, 500));

  try {
    const response = await aihubmixClient.chat({
      model: 'gemini-3-flash-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0.1,
    });

    return response.choices[0]?.message.content.trim() || 'Unknown';
  } catch (error) {
    console.error('[WebTranslator] Language detection failed:', error);
    return 'Unknown';
  }
}

/**
 * 翻译内容
 */
async function translateContent(
  content: string,
  language: string
): Promise<{ translatedTitle: string; translatedContent: string; tokens: { prompt: number; completion: number; total: number } }> {
  const prompt = TRANSLATION_PROMPT
    .replace('{language}', language)
    .replace('{content}', content);

  const request: AihubmixChatRequest = {
    model: 'gemini-3-flash-preview',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 65536,
    temperature: 0.3,
  };

  const response = await aihubmixClient.chat(request);

  const translatedContent = response.choices[0]?.message.content || '';
  const translatedTitle = extractTranslatedTitle(translatedContent);

  return {
    translatedTitle: translatedTitle || '翻译结果',
    translatedContent,
    tokens: {
      prompt: response.usage.prompt_tokens,
      completion: response.usage.completion_tokens,
      total: response.usage.total_tokens,
    },
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<TranslateResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    // 验证 URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的 URL 地址' },
        { status: 400 }
      );
    }

    // 限制 URL 长度
    if (url.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'URL 长度超出限制' },
        { status: 400 }
      );
    }

    console.log(`[WebTranslator] Starting translation for: ${url}`);

    // 1. 使用 Firecrawl 抓取页面 (第一层基础过滤)
    console.log('[WebTranslator] Scraping page with Firecrawl...');
    let scrapeResult: ScrapeResult;

    try {
      scrapeResult = await firecrawl.scrape(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true, // Firecrawl 内置基础过滤
        timeout: 30000,
        waitFor: 1000,
      }) as ScrapeResult;
    } catch (firecrawlError) {
      console.error('[WebTranslator] Firecrawl error:', firecrawlError);
      return NextResponse.json(
        { success: false, error: '无法抓取网页内容,请检查 URL 是否正确或网站是否可访问' },
        { status: 422 }
      );
    }

    if (!scrapeResult.markdown) {
      return NextResponse.json(
        { success: false, error: '无法提取网页内容' },
        { status: 422 }
      );
    }

    const originalTitle = scrapeResult.title || 'Untitled';
    const originalContent = scrapeResult.markdown;

    console.log(`[WebTranslator] Page scraped: ${originalTitle}`);

    // 2. AI 智能提取正文 (第二层精过滤)
    console.log('[WebTranslator] Extracting main content with AI...');
    const extractedContent = await extractMainContent(originalContent);
    // Note: Title will be extracted from translated content

    // 3. 检测原文语言
    console.log('[WebTranslator] Detecting language...');
    const originalLanguage = await detectLanguage(extractedContent);
    console.log(`[WebTranslator] Detected language: ${originalLanguage}`);

    // 4. 翻译内容
    console.log('[WebTranslator] Translating with Gemini...');
    const { translatedTitle, translatedContent, tokens } = await translateContent(
      extractedContent,
      originalLanguage
    );

    console.log(`[WebTranslator] Translation complete. Tokens: ${tokens.total}`);

    // 5. 提取图片信息
    const images = extractImages(translatedContent);

    return NextResponse.json({
      success: true,
      data: {
        originalTitle,
        originalLanguage,
        translatedTitle,
        translatedContent,
        images,
        modelId: 'gemini-3-flash-preview',
        tokens,
      },
    });
  } catch (error) {
    console.error('[WebTranslator] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '翻译过程中发生错误,请稍后重试',
      },
      { status: 500 }
    );
  }
}
