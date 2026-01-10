'use client';

import { useState, useCallback } from 'react';
import type { AihubmixMessage } from '@/lib/api/aihubmix/types';

export interface AihubmixOptions {
  model: string;
  messages: AihubmixMessage[];
  temperature?: number;
  maxTokens?: number;
  thinking?: boolean;
}

export interface UseAihubmixReturn {
  call: <T = any>(options: AihubmixOptions) => Promise<T>;
  loading: boolean;
  error: string | null;
}

/**
 * Aihubmix API 调用统一封装 Hook
 * 提供标准化的 AI API 调用接口
 */
export function useAihubmix(): UseAihubmixReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async <T = any>(options: AihubmixOptions): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/aihubmix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API call failed');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error };
}

/**
 * 从 API 响应中提取内容
 */
export function extractContent(data: any): string {
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * 便捷函数：直接调用 Aihubmix API 并返回内容
 */
export async function callAihubmix(options: AihubmixOptions): Promise<string> {
  const response = await fetch('/api/aihubmix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API call failed');
  }

  const data = await response.json();
  return extractContent(data);
}

/**
 * 便捷函数：直接调用 Aihubmix API 并返回完整响应
 */
export async function callAihubmixFull<T = any>(options: AihubmixOptions): Promise<T> {
  const response = await fetch('/api/aihubmix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API call failed');
  }

  return await response.json();
}
