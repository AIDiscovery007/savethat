/**
 * Aihubmix SDK 客户端封装
 * 使用 Vercel AI SDK 的 aihubmix provider
 * 一个 API Key 支持多家模型（OpenAI、Claude、Gemini 等）
 */

import { createAihubmix } from '@aihubmix/ai-sdk-provider';

/**
 * 创建 aihubmix 实例
 * 从环境变量读取 API Key
 */
export const aihubmix = createAihubmix({
  apiKey: process.env.AIHUBMIX_API_KEY || '',
});

/**
 * 获取指定模型的实例
 * @param modelId - 模型 ID（如 'gpt-4o-mini', 'claude-3-7-sonnet-20250219'）
 */
export function getModel(modelId: string) {
  return aihubmix(modelId);
}

/**
 * 检查 API Key 是否配置
 */
export function isConfigured(): boolean {
  return !!process.env.AIHUBMIX_API_KEY;
}
