/**
 * 网页翻译存储适配器
 * 使用 localStorage 存储翻译记录
 */

import type {
  WebTranslationRecord,
  WebTranslationStorageAdapter,
  TranslationSearchQuery,
} from './web-translation-types';

// 配置
const STORAGE_KEY = 'web_translation_history';
const DEFAULT_MAX_RECORDS = 100;
const DEFAULT_LIMIT = 50;

// 工具函数: 按日期降序排序
const sortByDateDesc = (a: WebTranslationRecord, b: WebTranslationRecord) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

// 工具函数: 生成唯一ID
export function generateTranslationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `wt_${timestamp}_${randomPart}`;
}

// 工具函数: 从 URL 提取域名作为标题(备用)
export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

class LocalWebTranslationStorage implements WebTranslationStorageAdapter {
  private maxRecords: number;
  private eventListeners: Map<string, Set<(data?: unknown) => void>>;

  constructor(maxRecords: number = DEFAULT_MAX_RECORDS) {
    this.maxRecords = maxRecords;
    this.eventListeners = new Map();

    // 监听跨标签页同步
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          this.emitEvent('sync');
        }
      });
    }
  }

  private getStorageData(): WebTranslationRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[WebTranslationStorage] Failed to parse storage data:', error);
      return [];
    }
  }

  private setStorageData(data: WebTranslationRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.emitEvent('change');
    } catch (error) {
      console.error('[WebTranslationStorage] Failed to save storage data:', error);
    }
  }

  private emitEvent(type: string, data?: unknown): void {
    const listeners = this.eventListeners.get(type);
    const allListeners = this.eventListeners.get('*');

    listeners?.forEach(listener => listener(data));
    allListeners?.forEach(listener => listener(data));
  }

  async saveTranslation(record: WebTranslationRecord): Promise<void> {
    const records = [record, ...this.getStorageData()]
      .slice(0, this.maxRecords);

    this.setStorageData(records);
    this.emitEvent('save', record);
  }

  async getTranslation(id: string): Promise<WebTranslationRecord | null> {
    const records = this.getStorageData();
    return records.find(r => r.id === id) || null;
  }

  async getAllTranslations(): Promise<WebTranslationRecord[]> {
    return this.getStorageData().sort(sortByDateDesc);
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const records = this.getStorageData();
    const filtered = records.filter(r => r.id !== id);

    if (filtered.length === records.length) return false;

    this.setStorageData(filtered);
    this.emitEvent('delete', id);
    return true;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const records = this.getStorageData();
    const index = records.findIndex(r => r.id === id);

    if (index === -1) return false;

    records[index] = {
      ...records[index],
      isFavorite: !records[index].isFavorite,
      updatedAt: new Date().toISOString(),
    };

    this.setStorageData(records);
    this.emitEvent('update', records[index]);
    return true;
  }

  async clearAll(): Promise<void> {
    this.setStorageData([]);
    this.emitEvent('clear');
  }

  async search(query: TranslationSearchQuery): Promise<WebTranslationRecord[]> {
    let records = this.getStorageData();

    // 收藏筛选
    if (query.favoritesOnly) {
      records = records.filter(r => r.isFavorite);
    }

    // 文本搜索
    if (query.query) {
      const lowerQuery = query.query.toLowerCase();
      records = records.filter(r =>
        r.translatedTitle.toLowerCase().includes(lowerQuery) ||
        r.originalUrl.toLowerCase().includes(lowerQuery) ||
        r.originalLanguage.toLowerCase().includes(lowerQuery)
      );
    }

    // 分页
    const offset = query.offset || 0;
    const limit = query.limit || DEFAULT_LIMIT;

    return records.sort(sortByDateDesc).slice(offset, offset + limit);
  }

  // 检查 URL 是否已翻译
  async isUrlTranslated(url: string): Promise<boolean> {
    const records = this.getStorageData();
    return records.some(r => r.originalUrl === url);
  }

  // 获取 URL 对应的翻译记录
  async getTranslationByUrl(url: string): Promise<WebTranslationRecord | null> {
    const records = this.getStorageData();
    return records.find(r => r.originalUrl === url) || null;
  }

  // 事件监听
  addEventListener(type: string, listener: (data?: unknown) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);

    return () => {
      this.eventListeners.get(type)?.delete(listener);
    };
  }

  // 统计信息
  async getStats(): Promise<{
    total: number;
    favorites: number;
    byLanguage: Record<string, number>;
  }> {
    const records = this.getStorageData();
    const byLanguage: Record<string, number> = {};
    let favorites = 0;

    records.forEach(r => {
      byLanguage[r.originalLanguage] = (byLanguage[r.originalLanguage] || 0) + 1;
      if (r.isFavorite) favorites++;
    });

    return { total: records.length, favorites, byLanguage };
  }
}

// 导出单例实例
export const webTranslationStorage = new LocalWebTranslationStorage();

// 便捷函数: 创建新的翻译记录
export function createTranslationRecord(params: {
  originalUrl: string;
  originalTitle: string;
  originalLanguage: string;
  translatedTitle: string;
  translatedContent: string;
  images: Array<{ src: string; alt?: string }>;
  modelId: string;
  modelName: string;
  tokens?: { prompt: number; completion: number; total: number };
}): WebTranslationRecord {
  return {
    id: generateTranslationId(),
    originalUrl: params.originalUrl,
    originalTitle: params.originalTitle,
    originalLanguage: params.originalLanguage,
    translatedTitle: params.translatedTitle,
    translatedContent: params.translatedContent,
    images: params.images.map((img, index) => ({
      src: img.src,
      alt: img.alt,
      position: index,
    })),
    modelId: params.modelId,
    modelName: params.modelName,
    tokens: params.tokens,
    createdAt: new Date().toISOString(),
    isFavorite: false,
  };
}
