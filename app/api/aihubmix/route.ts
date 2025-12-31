/**
 * Aihubmix API 代理路由
 * 提供统一的 API 接口，支持同步和流式响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { aihubmixClient } from '@/lib/api/aihubmix/client';
import type { AihubmixChatRequest, AihubmixStreamChunk } from '@/lib/api/aihubmix/types';

/**
 * POST 处理函数
 * 支持同步和流式聊天完成请求
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AihubmixChatRequest = await request.json();

    // 请求验证
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: validationError.status }
      );
    }

    // 检查是否需要流式响应
    const wantsStream = body.stream ?? false;

    if (wantsStream) {
      return handleStreamRequest(body);
    } else {
      return handleSyncRequest(body);
    }
  } catch (error) {
    console.error('[Aihubmix API] Request error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 验证请求参数
 */
function validateRequest(body: AihubmixChatRequest): { message: string; status: number } | null {
  if (!body.model) {
    return { message: 'Missing required parameter: model', status: 400 };
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { message: 'Missing required parameter: messages', status: 400 };
  }

  // 验证消息格式
  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    if (!msg.role || !['system', 'user', 'assistant', 'tool'].includes(msg.role)) {
      return {
        message: `Invalid message role at index ${i}: ${msg.role}`,
        status: 400,
      };
    }
    if (typeof msg.content !== 'string') {
      return {
        message: `Invalid message content at index ${i}: content must be a string`,
        status: 400,
      };
    }
  }

  return null;
}

/**
 * 处理同步请求
 */
async function handleSyncRequest(request: AihubmixChatRequest): Promise<NextResponse> {
  try {
    const response = await aihubmixClient.chat(request);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Aihubmix API] Sync request error:', error);

    if (error instanceof aihubmixClient.constructor.prototype?.__proto__?.constructor) {
      const apiError = error as { message: string; statusCode: number };
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 处理流式请求
 */
function handleStreamRequest(request: AihubmixChatRequest): NextResponse {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = aihubmixClient.chatStream(request, {
          onStream: (chunk: AihubmixStreamChunk) => {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          },
        });

        for await (const chunk of generator) {
          // 已经在 onStream 中处理
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('[Aihubmix API] Stream error:', error);
        const errorData = JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
    cancel() {
      // 处理流被取消的情况
      console.log('[Aihubmix API] Stream cancelled');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * GET 处理函数
 * 健康检查端点
 */
export async function GET(): Promise<NextResponse> {
  const isHealthy = await aihubmixClient.healthCheck();

  if (isHealthy) {
    return NextResponse.json({ status: 'ok', service: 'aihubmix' });
  } else {
    return NextResponse.json(
      { status: 'error', message: 'Service unavailable' },
      { status: 503 }
    );
  }
}
