/**
 * Aihubmix API 客户端封装
 * 提供同步和流式调用方法，支持错误处理和重试逻辑
 */

import type {
  AihubmixChatRequest,
  AihubmixChatResponse,
  AihubmixStreamChunk,
  AihubmixError,
  RequestOptions,
} from './types';

/**
 * API 客户端配置
 */
interface ClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Aihubmix API 客户端类
 */
export class AihubmixClient {
  private config: ClientConfig;

  constructor(config?: Partial<ClientConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.AIHUBMIX_API_KEY || '',
      baseUrl: config?.baseUrl || process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1',
      timeout: config?.timeout || 60000, // 默认 60 秒
      maxRetries: config?.maxRetries || 3,
    };

    if (!this.config.apiKey) {
      console.warn('[AihubmixClient] API key not configured. Set AIHUBMIX_API_KEY in environment variables.');
    }
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 内部请求执行
   */
  private async executeRequest<T>(
    url: string,
    body: object,
    timeoutMs: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as AihubmixError;
        throw new AihubmixAPIError(
          errorData.error?.message || `API request failed with status ${response.status}`,
          response.status,
          errorData.error?.type
        );
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 执行带重试的请求
   */
  private async requestWithRetry<T>(
    url: string,
    body: object,
    options?: RequestOptions
  ): Promise<T> {
    const { timeout, maxRetries } = this.config;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(url, body, options?.timeout || timeout);
      } catch (error) {
        lastError = error as Error;

        // 客户端错误不重试
        if (error instanceof AihubmixAPIError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[AihubmixClient] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * 发送聊天完成请求（同步）
   */
  async chat(request: AihubmixChatRequest, options?: RequestOptions): Promise<AihubmixChatResponse> {
    const { baseUrl } = this.config;
    return this.requestWithRetry(`${baseUrl}/chat/completions`, { ...request, stream: false }, options);
  }

  /**
   * 发送聊天完成请求（流式）
   */
  async *chatStream(request: AihubmixChatRequest, options?: RequestOptions): AsyncGenerator<AihubmixStreamChunk> {
    const { apiKey, baseUrl, timeout } = this.config;
    const url = `${baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as AihubmixError;
        throw new AihubmixAPIError(
          errorData.error?.message || `API request failed with status ${response.status}`,
          response.status,
          errorData.error?.type
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 处理 SSE 格式的数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const chunk = JSON.parse(data) as AihubmixStreamChunk;
              yield chunk;
              options?.onStream?.(chunk);
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
      controller.abort();
    }
  }

  /**
   * 检查 API 是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { apiKey, baseUrl } = this.config;
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * API 错误类
 */
export class AihubmixAPIError extends Error {
  statusCode: number;
  errorType?: string;

  constructor(message: string, statusCode: number, errorType?: string) {
    super(message);
    this.name = 'AihubmixAPIError';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

/**
 * 导出单例实例
 */
export const aihubmixClient = new AihubmixClient();
