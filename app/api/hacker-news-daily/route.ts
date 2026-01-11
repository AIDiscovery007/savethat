/**
 * Hacker News 每日资讯 API
 * 直接获取 Top/New/Best Stories，AI 翻译成中文
 */

import { NextRequest, NextResponse } from 'next/server';
import { getModel } from '@/lib/api/aihubmix/sdk-client';
import { generateText } from 'ai';
import { getModelById } from '@/lib/api/aihubmix/models';

// 配置
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MODEL_ID = 'gemini-3-flash-preview-search';

// 缓存存储（内存缓存，有效期1小时）
interface CacheEntry {
  data: {
    items: Array<{
      id: number;
      title: string;
      url: string;
      domain: string;
      score: number;
      by: string;
      time: number;
      summary: string;
    }>;
    source: string;
    generatedAt: string;
  };
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

// Hacker News API 基础 URL
const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// 获取故事列表
async function getStoryIds(source: string): Promise<number[]> {
  const response = await fetch(`${HN_API_BASE}/${source}.json`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch story IDs');
  }

  return response.json();
}

// 获取单个故事详情
async function getStory(id: number): Promise<{
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
} | null> {
  const response = await fetch(`${HN_API_BASE}/item/${id}.json`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;
  return response.json();
}

// 提取域名
function extractDomain(url?: string): string {
  if (!url) return 'news.ycombinator.com';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'news.ycombinator.com';
  }
}

// 翻译故事
async function translateStories(
  stories: Array<{
    id: number;
    title: string;
    url?: string;
    score: number;
    by: string;
    time: number;
  }>,
  limit: number
): Promise<Array<{
  id: number;
  title: string;
  url: string;
  domain: string;
  score: number;
  by: string;
  time: number;
  summary: string;
}>> {
  const model = getModel(MODEL_ID);
  const modelInfo = getModelById(MODEL_ID);
  const maxTokens = modelInfo?.maxOutputTokens ?? 65536;

  const storiesData = stories.slice(0, limit).map(s => ({
    id: s.id,
    title: s.title,
    url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
    score: s.score,
    by: s.by,
    time: s.time,
  }));

  const prompt = `你是一个专业的中文技术翻译。将以下 Hacker News 故事翻译成地道的中文，并生成一句话摘要。

数据：
${JSON.stringify(storiesData, null, 2)}

输出格式（JSON数组）：
[
  {
    "id": 故事ID,
    "title": "中文翻译标题",
    "summary": "一句话摘要（10-20字）"
  }
]

规则：
- 只返回 JSON 数组
- 翻译准确、地道
- 按原始顺序返回
- 必须包含 summary 字段`;

  try {
    const result = await generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxOutputTokens: maxTokens,
    });

    const jsonText = result.text.trim();
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '[]';
    const translations = JSON.parse(jsonStr);

    const storyMap = new Map(storiesData.map(s => [s.id, s]));

    return translations.map((t: { id: number; title: string; summary: string }) => {
      const story = storyMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        url: story?.url || `https://news.ycombinator.com/item?id=${t.id}`,
        domain: extractDomain(story?.url),
        score: story?.score || 0,
        by: story?.by || '',
        time: story?.time || Date.now() / 1000,
        summary: t.summary,
      };
    });
  } catch (error) {
    console.error('Translation error:', error);
    // 返回未翻译的数据
    return storiesData.map(s => ({
      id: s.id,
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      domain: extractDomain(s.url),
      score: s.score,
      by: s.by,
      time: s.time,
      summary: '',
    }));
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { source = 'topstories', limit = 20 } = body as {
      source?: 'topstories' | 'newstories' | 'beststories';
      limit?: number;
    };

    const cacheKey = `hn:${source}:${limit}`;

    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json({
        ...cached.data,
        cachedAt: new Date(cached.expiry - 60 * 60 * 1000).toISOString(),
        fromCache: true,
      });
    }

    // 获取故事列表
    const storyIds = await getStoryIds(source);

    // 获取前 limit 个故事的详情
    const stories = await Promise.all(
      storyIds.slice(0, limit).map(id => getStory(id))
    );

    const validStories = stories.filter((s): s is NonNullable<typeof s> => s !== null);

    // 翻译
    const translatedItems = await translateStories(validStories, limit);

    const response = {
      items: translatedItems,
      source,
      generatedAt: new Date().toISOString(),
    };

    // 保存缓存（1小时）
    cache.set(cacheKey, {
      data: response,
      expiry: Date.now() + 60 * 60 * 1000,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Hacker News API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
