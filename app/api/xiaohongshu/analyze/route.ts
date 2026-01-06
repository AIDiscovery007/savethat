import { NextRequest, NextResponse } from 'next/server';
import { aihubmixClient } from '@/lib/api/aihubmix/client';

/**
 * 小红书数据分析 API
 * POST /api/xiaohongshu/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    // 使用 aihubmix 客户端进行流式分析
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chunks = aihubmixClient.chatStream({
            model: model || 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `你是一位专业的小红书数据分析师，专注于帮助创作者优化内容策略、提升笔记表现。你的分析应该：
1. 数据驱动 - 基于实际数据提供洞察
2. 实用导向 - 给出可执行的建议
3. 专业深入 - 展现对小红书平台算法的理解
4. 结构清晰 - 输出易读的 Markdown 格式报告`,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4096,
          });

          for await (const chunk of chunks) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }

          controller.close();
        } catch (error) {
          console.error('[xiaohongshu-analyze] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[xiaohongshu-analyze] API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 健康检查
 */
export async function GET() {
  const isHealthy = await aihubmixClient.healthCheck();
  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'xiaohongshu-analytics',
  });
}
