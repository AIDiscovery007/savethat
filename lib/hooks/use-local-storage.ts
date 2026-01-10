'use client';

import { useState, useCallback, useEffect } from 'react';

export type SetValue<T> = ((value: T) => T) | T;

/**
 * localStorage 操作统一封装 Hook
 * 提供类型安全的 localStorage 读写操作
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      console.warn(`[useLocalStorage] Failed to read "${key}" from localStorage`);
      return initialValue;
    }
  });

  // 监听其他标签页的变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // 解析失败，忽略
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        console.warn(`[useLocalStorage] Failed to save "${key}" to localStorage:`, err);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to remove "${key}" from localStorage:`, err);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

/**
 * 便捷函数：同步保存到 localStorage（不使用 state）
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[setStorageItem] Failed to save "${key}":`, err);
  }
}

/**
 * 便捷函数：同步从 localStorage 读取
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 便捷函数：同步删除 localStorage 项
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[removeStorageItem] Failed to remove "${key}":`, err);
  }
}
