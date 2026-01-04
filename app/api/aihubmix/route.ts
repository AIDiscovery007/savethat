/**
 * Aihubmix API 代理路由
 * 使用 Vercel AI SDK 的 aihubmix provider
 * 一个 API Key 支持多家模型（OpenAI、Claude、Gemini 等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel, isConfigured } from '@/lib/api/aihubmix/sdk-client';
import type { AihubmixChatRequest } from '@/lib/api/aihubmix/types';

/**
 * POST 处理函数
 * 支持同步聊天完成请求（流式暂不实现）
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

    // 检查 API Key 配置
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'API key not configured. Please set AIHUBMIX_API_KEY in environment variables.' },
        { status: 401 }
      );
    }

    return handleSyncRequest(body);
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
 * 使用 Vercel AI SDK 的 generateText
 */
async function handleSyncRequest(request: AihubmixChatRequest): Promise<NextResponse> {
  try {
    const model = getModel(request.model);

    // 转换消息格式
    const messages = request.messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // 调用 generateText
    const result = await generateText({
      model,
      messages,
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.max_tokens ?? 4096,
      ...(request.thinking === true && {
        thinking: { type: 'enabled' },
      }),
    });

    // 区分提取 reasoningText 字段（当前不使用，但保留以便未来扩展）
    const { text, usage, response } = result;
    void result.reasoningText; // 保留字段以便未来使用

    // 转换为标准响应格式
    const responseBody = {
      id: response.id || `aihubmix-${Date.now()}`,
      object: 'chat.completion',
      created: response.timestamp || Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: usage.inputTokens || 0,
        completion_tokens: usage.outputTokens || 0,
        total_tokens: (usage.inputTokens || 0) + (usage.outputTokens || 0),
      },
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('[Aihubmix API] Sync request error:', error);

    // 处理 API 错误
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; message?: string };
      if (err.status || err.message) {
        return NextResponse.json(
          { error: err.message || 'API request failed' },
          { status: err.status || 500 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET 处理函数
 * 健康检查端点
 */
export async function GET(): Promise<NextResponse> {
  if (isConfigured()) {
    return NextResponse.json({ status: 'ok', service: 'aihubmix-sdk' });
  } else {
    return NextResponse.json(
      { status: 'error', message: 'API key not configured' },
      { status: 503 }
    );
  }
}
