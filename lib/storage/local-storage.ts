/**
 * 本地存储适配器实现
 * 使用 localStorage 存储优化历史记录
 */

import type {
  OptimizationHistory,
  StorageAdapter,
  SearchQuery,
  StorageConfig,
} from './types';

/**
 * 存储键名
 */
const STORAGE_KEY = 'prompt_optimizer_history';

/**
 * 最大记录数
 */
const DEFAULT_MAX_RECORDS = 50;

/**
 * 本地存储适配器类
 */
export class LocalStorageAdapter implements StorageAdapter {
  private maxRecords: number;
  private eventListeners: Map<StorageEventType, Set<(event: import('./types').StorageEvent) => void>>;

  constructor(config?: StorageConfig) {
    this.maxRecords = config?.maxRecords || DEFAULT_MAX_RECORDS;
    this.eventListeners = new Map();
  }

  /**
   * 获取存储数据
   */
  private getStorageData(): OptimizationHistory[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error('[LocalStorageAdapter] Failed to parse storage data');
      return [];
    }
  }

  /**
   * 保存存储数据
   */
  private setStorageData(data: OptimizationHistory[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error('[LocalStorageAdapter] Failed to save storage data');
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: import('./types').StorageEventType, data?: OptimizationHistory | string): void {
    const event: import('./types').StorageEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }

    // 也触发通用监听器
    const allListeners = this.eventListeners.get('*' as StorageEventType);
    if (allListeners) {
      allListeners.forEach(listener => listener(event));
    }
  }

  /**
   * 保存历史记录
   */
  async save(history: OptimizationHistory): Promise<OptimizationHistory> {
    const records = this.getStorageData();

    // 添加新记录到开头
    records.unshift(history);

    // 限制记录数量
    if (records.length > this.maxRecords) {
      records.splice(this.maxRecords);
    }

    this.setStorageData(records);
    this.emitEvent('save', history);

    return history;
  }

  /**
   * 获取所有历史记录
   */
  async getAll(): Promise<OptimizationHistory[]> {
    return this.getStorageData().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 根据 ID 获取单条记录
   */
  async getById(id: string): Promise<OptimizationHistory | null> {
    const records = this.getStorageData();
    return records.find(r => r.id === id) || null;
  }

  /**
   * 更新历史记录
   */
  async update(id: string, data: Partial<OptimizationHistory>): Promise<OptimizationHistory | null> {
    const records = this.getStorageData();
    const index = records.findIndex(r => r.id === id);

    if (index === -1) {
      return null;
    }

    records[index] = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.setStorageData(records);
    this.emitEvent('update', records[index]);

    return records[index];
  }

  /**
   * 删除历史记录
   */
  async delete(id: string): Promise<boolean> {
    const records = this.getStorageData();
    const filtered = records.filter(r => r.id !== id);

    if (filtered.length === records.length) {
      return false;
    }

    this.setStorageData(filtered);
    this.emitEvent('delete', id);

    return true;
  }

  /**
   * 清空所有历史记录
   */
  async clear(): Promise<boolean> {
    this.setStorageData([]);
    this.emitEvent('clear');

    return true;
  }

  /**
   * 按条件搜索历史记录
   */
  async search(query: SearchQuery): Promise<OptimizationHistory[]> {
    let records = this.getStorageData();

    // 筛选条件
    if (query.userId) {
      records = records.filter(r => r.userId === query.userId);
    }

    if (query.modelId) {
      records = records.filter(r => r.modelId === query.modelId);
    }

    if (query.tags && query.tags.length > 0) {
      records = records.filter(r =>
        query.tags!.some(tag => r.tags?.includes(tag))
      );
    }

    if (query.isFavorite !== undefined) {
      records = records.filter(r => r.isFavorite === query.isFavorite);
    }

    if (query.startDate) {
      const startTime = new Date(query.startDate).getTime();
      records = records.filter(r => new Date(r.createdAt).getTime() >= startTime);
    }

    if (query.endDate) {
      const endTime = new Date(query.endDate).getTime();
      records = records.filter(r => new Date(r.createdAt).getTime() <= endTime);
    }

    // 排序
    records.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 分页
    const offset = query.offset || 0;
    const limit = query.limit || records.length;

    return records.slice(offset, offset + limit);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(
    type: StorageEventType | '*',
    listener: (event: import('./types').StorageEvent) => void
  ): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);

    // 返回移除监听器的函数
    return () => {
      this.eventListeners.get(type)?.delete(listener);
    };
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number;
    byModel: Record<string, number>;
    favorites: number;
  }> {
    const records = this.getStorageData();

    const byModel: Record<string, number> = {};
    let favorites = 0;

    records.forEach(r => {
      byModel[r.modelId] = (byModel[r.modelId] || 0) + 1;
      if (r.isFavorite) favorites++;
    });

    return {
      total: records.length,
      byModel,
      favorites,
    };
  }
}

/**
 * 导出单例实例
 */
export const storageAdapter = new LocalStorageAdapter();
