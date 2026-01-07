/**
 * 本地存储适配器实现
 * 使用 localStorage 存储优化历史记录
 */

import type {
  OptimizationHistory,
  StorageAdapter,
  SearchQuery,
  StorageConfig,
  StorageEventType,
  StorageEvent,
} from './types';

const STORAGE_KEY = 'prompt_optimizer_history';
const DEFAULT_MAX_RECORDS = 50;
const sortByDateDesc = (a: OptimizationHistory, b: OptimizationHistory) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export class LocalStorageAdapter implements StorageAdapter {
  private maxRecords: number;
  private eventListeners: Map<StorageEventType, Set<(event: StorageEvent) => void>>;

  constructor(config?: StorageConfig) {
    this.maxRecords = config?.maxRecords || DEFAULT_MAX_RECORDS;
    this.eventListeners = new Map();
  }

  private getStorageData(): OptimizationHistory[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error('[LocalStorageAdapter] Failed to parse storage data');
      return [];
    }
  }

  private setStorageData(data: OptimizationHistory[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error('[LocalStorageAdapter] Failed to save storage data');
    }
  }

  private emitEvent(type: StorageEventType, data?: OptimizationHistory | string): void {
    const event: StorageEvent = { type, data, timestamp: Date.now() };
    const trigger = (listeners?: Set<(event: StorageEvent) => void>) =>
      listeners?.forEach(listener => listener(event));

    trigger(this.eventListeners.get(type));
    trigger(this.eventListeners.get('*' as StorageEventType));
  }

  async save(history: OptimizationHistory): Promise<OptimizationHistory> {
    const records = [history, ...this.getStorageData()].slice(0, this.maxRecords);
    this.setStorageData(records);
    this.emitEvent('save', history);
    return history;
  }

  async getAll(): Promise<OptimizationHistory[]> {
    return this.getStorageData().sort(sortByDateDesc);
  }

  async getById(id: string): Promise<OptimizationHistory | null> {
    return this.getStorageData().find(r => r.id === id) || null;
  }

  async update(id: string, data: Partial<OptimizationHistory>): Promise<OptimizationHistory | null> {
    const records = this.getStorageData();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    records[index] = { ...records[index], ...data, updatedAt: new Date().toISOString() };
    this.setStorageData(records);
    this.emitEvent('update', records[index]);
    return records[index];
  }

  async delete(id: string): Promise<boolean> {
    const filtered = this.getStorageData().filter(r => r.id !== id);
    if (filtered.length === this.getStorageData().length) return false;
    this.setStorageData(filtered);
    this.emitEvent('delete', id);
    return true;
  }

  async clear(): Promise<boolean> {
    this.setStorageData([]);
    this.emitEvent('clear');
    return true;
  }

  async search(query: SearchQuery): Promise<OptimizationHistory[]> {
    let records = this.getStorageData();

    // Apply filters
    if (query.userId) records = records.filter(r => r.userId === query.userId);
    if (query.modelId) records = records.filter(r => r.modelId === query.modelId);
    if (query.tags?.length) records = records.filter(r => query.tags!.some(tag => r.tags?.includes(tag)));
    if (query.isFavorite !== undefined) records = records.filter(r => r.isFavorite === query.isFavorite);
    if (query.startDate) records = records.filter(r => new Date(r.createdAt).getTime() >= new Date(query.startDate!).getTime());
    if (query.endDate) records = records.filter(r => new Date(r.createdAt).getTime() <= new Date(query.endDate!).getTime());

    return records.sort(sortByDateDesc).slice(query.offset || 0, query.limit);
  }

  addEventListener(type: StorageEventType | '*', listener: (event: StorageEvent) => void): () => void {
    if (!this.eventListeners.has(type)) this.eventListeners.set(type, new Set());
    this.eventListeners.get(type)!.add(listener);
    return () => this.eventListeners.get(type)?.delete(listener);
  }

  async getStats(): Promise<{ total: number; byModel: Record<string, number>; favorites: number }> {
    const records = this.getStorageData();
    const byModel: Record<string, number> = {};
    let favorites = 0;

    records.forEach(r => {
      byModel[r.modelId] = (byModel[r.modelId] || 0) + 1;
      if (r.isFavorite) favorites++;
    });

    return { total: records.length, byModel, favorites };
  }
}

/**
 * 导出单例实例
 */
export const storageAdapter = new LocalStorageAdapter();
