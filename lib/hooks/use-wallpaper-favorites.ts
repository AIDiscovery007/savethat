'use client';

import * as React from 'react';
import type { WallpaperCollection, WallpaperFavoriteItem, WallhavenWallpaper } from '@/lib/storage/wallpaper-types';
import { wallpaperStorage } from '@/lib/storage/wallpaper-storage';

/**
 * 壁纸收藏夹 Hook
 */
export function useWallpaperFavorites() {
  const [collections, setCollections] = React.useState<WallpaperCollection[]>([]);
  const [favoritesMap, setFavoritesMap] = React.useState<Map<string, WallpaperFavoriteItem[]>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 加载所有收藏夹
  const loadCollections = React.useCallback(async () => {
    try {
      const data = await wallpaperStorage.getAllCollections();
      setCollections(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError('Failed to load collections');
    }
  }, []);

  // 加载某收藏夹的壁纸
  const loadFavorites = React.useCallback(async (collectionId: string) => {
    try {
      const items = await wallpaperStorage.getFavoritesByCollection(collectionId);
      setFavoritesMap((prev) => new Map(prev).set(collectionId, items));
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  // 初始化加载
  React.useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCollections();
      setLoading(false);
    };
    init();
  }, [loadCollections]);

  // ========== 收藏夹操作 ==========

  /**
   * 创建收藏夹
   */
  const createCollection = React.useCallback(
    async (name: string, description?: string) => {
      try {
        const newCollection = await wallpaperStorage.createCollection(name, description);
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection;
      } catch (err) {
        console.error('Failed to create collection:', err);
        setError('Failed to create collection');
        throw err;
      }
    },
    []
  );

  /**
   * 更新收藏夹
   */
  const updateCollection = React.useCallback(
    async (id: string, data: Partial<Pick<WallpaperCollection, 'name' | 'description'>>) => {
      try {
        const updated = await wallpaperStorage.updateCollection(id, data);
        if (updated) {
          setCollections((prev) =>
            prev.map((c) => (c.id === id ? updated : c))
          );
        }
        return updated;
      } catch (err) {
        console.error('Failed to update collection:', err);
        setError('Failed to update collection');
        throw err;
      }
    },
    []
  );

  /**
   * 删除收藏夹
   */
  const deleteCollection = React.useCallback(
    async (id: string) => {
      try {
        await wallpaperStorage.deleteCollection(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));
        setFavoritesMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        console.error('Failed to delete collection:', err);
        setError('Failed to delete collection');
        throw err;
      }
    },
    []
  );

  // ========== 收藏操作 ==========

  /**
   * 添加壁纸到收藏夹
   */
  const addToCollection = React.useCallback(
    async (collectionId: string, wallpaper: WallhavenWallpaper) => {
      try {
        const item = await wallpaperStorage.addToCollection(collectionId, wallpaper);
        // 更新本地状态
        setFavoritesMap((prev) => {
          const items = prev.get(collectionId) || [];
          // 检查是否已存在
          if (items.some((i) => i.wallpaperId === wallpaper.id)) {
            return prev;
          }
          const next = new Map(prev);
          next.set(collectionId, [item, ...items]);
          return next;
        });
        // 更新收藏夹更新时间
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId ? { ...c, updatedAt: new Date().toISOString() } : c
          )
        );
        return item;
      } catch (err) {
        console.error('Failed to add to collection:', err);
        setError('Failed to add to collection');
        throw err;
      }
    },
    []
  );

  /**
   * 从收藏夹移除壁纸
   */
  const removeFromCollection = React.useCallback(
    async (itemId: string, collectionId: string) => {
      try {
        await wallpaperStorage.removeFromCollection(itemId);
        setFavoritesMap((prev) => {
          const items = (prev.get(collectionId) || []).filter((i) => i.id !== itemId);
          const next = new Map(prev);
          next.set(collectionId, items);
          return next;
        });
      } catch (err) {
        console.error('Failed to remove from collection:', err);
        setError('Failed to remove from collection');
        throw err;
      }
    },
    []
  );

  /**
   * 切换收藏状态
   */
  const toggleFavorite = React.useCallback(
    async (collectionId: string, wallpaper: WallhavenWallpaper) => {
      const isFavorited = await wallpaperStorage.isInCollection(collectionId, wallpaper.id);
      if (isFavorited) {
        const item = await wallpaperStorage.getFavoriteByWallpaperId(collectionId, wallpaper.id);
        if (item) {
          await removeFromCollection(item.id, collectionId);
        }
      } else {
        await addToCollection(collectionId, wallpaper);
      }
    },
    [addToCollection, removeFromCollection]
  );

  /**
   * 检查壁纸是否在收藏夹中
   */
  const isInCollection = React.useCallback(
    async (collectionId: string, wallpaperId: string) => {
      return wallpaperStorage.isInCollection(collectionId, wallpaperId);
    },
    []
  );

  /**
   * 获取收藏夹中的壁纸
   */
  const getFavorites = React.useCallback(
    (collectionId: string) => {
      return favoritesMap.get(collectionId) || [];
    },
    [favoritesMap]
  );

  /**
   * 获取某壁纸所在的收藏夹列表
   */
  const getCollectionsContainingWallpaper = React.useCallback(
    async (wallpaperId: string) => {
      const checks = collections.map(async (collection) => {
        const isIn = await wallpaperStorage.isInCollection(collection.id, wallpaperId);
        return isIn ? collection : null;
      });
      const results = await Promise.all(checks);
      return results.filter((c): c is WallpaperCollection => c !== null);
    },
    [collections]
  );

  return {
    // 状态
    collections,
    loading,
    error,

    // 收藏夹操作
    loadCollections,
    loadFavorites,
    createCollection,
    updateCollection,
    deleteCollection,

    // 收藏操作
    addToCollection,
    removeFromCollection,
    toggleFavorite,
    isInCollection,
    getFavorites,
    getCollectionsContainingWallpaper,
  };
}
