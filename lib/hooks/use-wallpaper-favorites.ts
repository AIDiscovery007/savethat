'use client';

import * as React from 'react';
import type { WallpaperCollection, WallpaperFavoriteItem, WallhavenWallpaper } from '@/lib/storage/wallpaper-types';
import { wallpaperStorage } from '@/lib/storage/wallpaper-storage';

function handleError(err: unknown, message: string, setError: (msg: string) => void): never {
  console.error(message, err);
  setError(message);
  throw err;
}

/**
 * 壁纸收藏夹 Hook
 */
export function useWallpaperFavorites() {
  const [collections, setCollections] = React.useState<WallpaperCollection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 使用 ref 缓存壁纸列表，避免不必要的 Map 对象创建
  const favoritesCache = React.useRef<Map<string, WallpaperFavoriteItem[]>>(new Map());

  const loadCollections = React.useCallback(async () => {
    try {
      const data = await wallpaperStorage.getAllCollections();
      setCollections(data);
      setError(null);
    } catch (err) {
      handleError(err, 'Failed to load collections', setError);
    }
  }, []);

  const loadFavorites = React.useCallback(async (collectionId: string) => {
    try {
      const items = await wallpaperStorage.getFavoritesByCollection(collectionId);
      favoritesCache.current.set(collectionId, items);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCollections();
      setLoading(false);
    };
    init();
  }, [loadCollections]);

  const createCollection = React.useCallback(
    async (name: string, description?: string) => {
      try {
        const newCollection = await wallpaperStorage.createCollection(name, description);
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection;
      } catch (err) {
        handleError(err, 'Failed to create collection', setError);
      }
    },
    []
  );

  const updateCollection = React.useCallback(
    async (id: string, data: Partial<Pick<WallpaperCollection, 'name' | 'description'>>) => {
      try {
        const updated = await wallpaperStorage.updateCollection(id, data);
        if (updated) {
          setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
        }
        return updated;
      } catch (err) {
        handleError(err, 'Failed to update collection', setError);
      }
    },
    []
  );

  const deleteCollection = React.useCallback(
    async (id: string) => {
      try {
        await wallpaperStorage.deleteCollection(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));
        favoritesCache.current.delete(id);
      } catch (err) {
        handleError(err, 'Failed to delete collection', setError);
      }
    },
    []
  );

  const addToCollection = React.useCallback(
    async (collectionId: string, wallpaper: WallhavenWallpaper) => {
      try {
        const item = await wallpaperStorage.addToCollection(collectionId, wallpaper);
        const cache = favoritesCache.current;
        const items = cache.get(collectionId) || [];
        if (!items.some((i) => i.wallpaperId === wallpaper.id)) {
          cache.set(collectionId, [item, ...items]);
        }
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId ? { ...c, updatedAt: new Date().toISOString() } : c
          )
        );
        return item;
      } catch (err) {
        handleError(err, 'Failed to add to collection', setError);
      }
    },
    []
  );

  const removeFromCollection = React.useCallback(
    async (itemId: string, collectionId: string) => {
      try {
        await wallpaperStorage.removeFromCollection(itemId);
        const cache = favoritesCache.current;
        const items = (cache.get(collectionId) || []).filter((i) => i.id !== itemId);
        cache.set(collectionId, items);
      } catch (err) {
        handleError(err, 'Failed to remove from collection', setError);
      }
    },
    []
  );

  const toggleFavorite = React.useCallback(
    async (collectionId: string, wallpaper: WallhavenWallpaper) => {
      const isFavorited = await wallpaperStorage.isInCollection(collectionId, wallpaper.id);
      if (isFavorited) {
        const item = await wallpaperStorage.getFavoriteByWallpaperId(collectionId, wallpaper.id);
        if (item) await removeFromCollection(item.id, collectionId);
      } else {
        await addToCollection(collectionId, wallpaper);
      }
    },
    [addToCollection, removeFromCollection]
  );

  const isInCollection = React.useCallback(
    async (collectionId: string, wallpaperId: string) => {
      return wallpaperStorage.isInCollection(collectionId, wallpaperId);
    },
    []
  );

  const getFavorites = React.useCallback((collectionId: string) => {
    return favoritesCache.current.get(collectionId) || [];
  }, []);

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
    collections,
    loading,
    error,
    loadCollections,
    loadFavorites,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    toggleFavorite,
    isInCollection,
    getFavorites,
    getCollectionsContainingWallpaper,
  };
}
