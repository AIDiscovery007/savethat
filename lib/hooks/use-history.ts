'use client';

/**
 * 历史记录管理 Hook
 * 使用 storageAdapter 管理本地存储的历史记录
 */

import { useState, useEffect, useCallback } from 'react';
import type { OptimizationHistory, SearchQuery } from '@/lib/storage/types';
import { storageAdapter } from '@/lib/storage/local-storage';

export interface HistoryState {
  records: OptimizationHistory[];
  isLoading: boolean;
  error: string | null;
  stats: { total: number; byModel: Record<string, number>; favorites: number } | null;
}

export function useHistory() {
  const [state, setState] = useState<HistoryState>({
    records: [],
    isLoading: true,
    error: null,
    stats: null,
  });

  const loadHistory = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const [records, stats] = await Promise.all([
        storageAdapter.getAll(),
        storageAdapter.getStats(),
      ]);
      setState({ records, isLoading: false, error: null, stats });
    } catch (error) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load history',
      }));
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const unsubscribe = storageAdapter.addEventListener('*', loadHistory);
    return unsubscribe;
  }, [loadHistory]);

  const saveRecord = useCallback((record: OptimizationHistory): Promise<boolean> =>
    storageAdapter.save(record).then(() => true).catch(error => {
      console.error('[useHistory] Failed to save record:', error);
      return false;
    }), []);

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    const success = await storageAdapter.delete(id);
    if (success) await loadHistory();
    return success;
  }, [loadHistory]);

  const updateRecord = useCallback(async (
    id: string,
    data: Partial<OptimizationHistory>
  ): Promise<OptimizationHistory | null> => {
    try {
      const result = await storageAdapter.update(id, data);
      if (result) await loadHistory();
      return result;
    } catch (error) {
      console.error('[useHistory] Failed to update record:', error);
      return null;
    }
  }, [loadHistory]);

  const clearHistory = useCallback(async (): Promise<boolean> => {
    try {
      const success = await storageAdapter.clear();
      if (success) await loadHistory();
      return success;
    } catch (error) {
      console.error('[useHistory] Failed to clear history:', error);
      return false;
    }
  }, [loadHistory]);

  const searchRecords = useCallback(async (query: SearchQuery): Promise<OptimizationHistory[]> => {
    try {
      return await storageAdapter.search(query);
    } catch (error) {
      console.error('[useHistory] Failed to search records:', error);
      return [];
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const record = state.records.find(r => r.id === id);
    if (!record) return false;
    const result = await updateRecord(id, { isFavorite: !record.isFavorite });
    return result !== null;
  }, [state.records, updateRecord]);

  const getRecord = useCallback(async (id: string): Promise<OptimizationHistory | null> => {
    try {
      return await storageAdapter.getById(id);
    } catch (error) {
      console.error('[useHistory] Failed to get record:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    loadHistory,
    saveRecord,
    deleteRecord,
    updateRecord,
    clearHistory,
    searchRecords,
    toggleFavorite,
    getRecord,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createHistoryRecord(
  originalPrompt: string,
  optimizedPrompt: string,
  modelId: string,
  modelName: string,
  stages: OptimizationHistory['stages'],
  totalDuration?: number
): OptimizationHistory {
  return {
    id: generateId(),
    originalPrompt,
    optimizedPrompt,
    modelId,
    modelName,
    stages,
    totalDuration,
    createdAt: new Date().toISOString(),
  };
}
