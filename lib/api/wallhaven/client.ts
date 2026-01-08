/**
 * Wallhaven API 客户端
 * 提供壁纸搜索、详情查询等方法
 */

import type { WallhavenWallpaper, WallhavenSearchParams, WallhavenSearchResponse } from './types';

export interface WallhavenClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Wallhaven API 客户端类
 */
export class WallhavenClient {
  private config: WallhavenClientConfig;

  constructor(config?: Partial<WallhavenClientConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.WALLHAVEN_API_KEY || '',
      baseUrl: config?.baseUrl || 'https://wallhaven.cc/api/v1',
      timeout: config?.timeout || 30000,
    };

    if (!this.config.apiKey) {
      console.warn('[WallhavenClient] API key not configured. Set WALLHAVEN_API_KEY in environment variables.');
    }
  }

  /**
 * 内部通用请求方法
 */
private async fetchWithTimeout<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const { apiKey } = this.config;
  const headers: HeadersInit = { 'Accept': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const response = await fetch(url, { method: 'GET', headers, signal });

  if (!response.ok) {
    throw new WallhavenAPIError(
      `API request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

/**
 * 搜索壁纸
 */
async search(params: WallhavenSearchParams): Promise<WallhavenSearchResponse> {
  const { baseUrl, timeout } = this.config;
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.categories) searchParams.set('categories', params.categories);
  if (params.purity) searchParams.set('purity', params.purity);
  if (params.sorting) searchParams.set('sorting', params.sorting);
  if (params.order) searchParams.set('order', params.order);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const url = `${baseUrl}/search?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await this.fetchWithTimeout(url, controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 获取壁纸详情
 */
async getWallpaper(id: string): Promise<WallhavenWallpaper> {
  const { baseUrl, timeout } = this.config;
  const url = `${baseUrl}/w/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const data = await this.fetchWithTimeout<{ data: WallhavenWallpaper }>(url, controller.signal);
    return data.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

  /**
   * 下载壁纸（获取实际文件 URL）
   */
  async getDownloadUrl(id: string): Promise<string> {
    const wallpaper = await this.getWallpaper(id);
    // API 返回的 path 字段就是原图 URL
    if ('path' in wallpaper && wallpaper.path) {
      return wallpaper.path;
    }
    // Fallback: 构造 URL
    const path = id.substring(0, 2).toLowerCase();
    const ext = wallpaper.file_type.split('/')[1] || 'jpg';
    return `https://w.wallhaven.cc/full/${path}/wallhaven-${id}.${ext}`;
  }

  /**
   * 检查 API 是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { apiKey, baseUrl } = this.config;
      const response = await fetch(`${baseUrl}/search`, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
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
export class WallhavenAPIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'WallhavenAPIError';
    this.statusCode = statusCode;
  }
}

/**
 * 导出单例实例
 */
export const wallhavenClient = new WallhavenClient();
