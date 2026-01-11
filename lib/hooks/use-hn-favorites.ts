'use client';

import * as React from 'react';
import type { HNCollection, HNFavoriteItem } from '@/lib/storage/hn-types';
import { hnStorage } from '@/lib/storage/hn-storage';

function handleError(err: unknown, message: string, setError: (msg: string) => void): never {
  console.error(message, err);
  setError(message);
  throw err;
}

/**
 * Hacker News 收藏 Hook
 */
export function useHNFavorites() {
  const [collections, setCollections] = React.useState<HNCollection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingFavorites, setLoadingFavorites] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 使用 ref 缓存收藏列表，避免不必要的 Map 对象创建
  const favoritesCache = React.useRef<Map<string, HNFavoriteItem[]>>(new Map());

  const loadCollections = React.useCallback(async () => {
    try {
      const data = await hnStorage.getAllCollections();
      setCollections(data);
      setError(null);
      return data;
    } catch (err) {
      handleError(err, 'Failed to load collections', setError);
      return [];
    }
  }, []);

  const loadFavorites = React.useCallback(async (collectionId: string) => {
    try {
      const items = await hnStorage.getFavoritesByCollection(collectionId);
      favoritesCache.current.set(collectionId, items);
      return items;
    } catch (err) {
      console.error('Failed to load favorites:', err);
      return [];
    }
  }, []);

  // 初始化：加载收藏夹和所有收藏内容
  React.useEffect(() => {
    let ignore = false;

    const init = async () => {
      setLoading(true);
      const collectionsData = await loadCollections();

      // 并行加载所有收藏夹的收藏内容
      if (!ignore && collectionsData.length > 0) {
        setLoadingFavorites(true);
        await Promise.all(
          collectionsData.map((c) => loadFavorites(c.id))
        );
        setLoadingFavorites(false);
      }

      setLoading(false);
    };

    init();

    return () => {
      ignore = true;
    };
  }, [loadCollections, loadFavorites]);

  const createCollection = React.useCallback(
    async (name: string, description?: string) => {
      try {
        const newCollection = await hnStorage.createCollection(name, description);
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection;
      } catch (err) {
        handleError(err, 'Failed to create collection', setError);
      }
    },
    []
  );

  const updateCollection = React.useCallback(
    async (id: string, data: Partial<Pick<HNCollection, 'name' | 'description'>>) => {
      try {
        const updated = await hnStorage.updateCollection(id, data);
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
        await hnStorage.deleteCollection(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));
        favoritesCache.current.delete(id);
      } catch (err) {
        handleError(err, 'Failed to delete collection', setError);
      }
    },
    []
  );

  const addToCollection = React.useCallback(
    async (collectionId: string, news: HNFavoriteItem['news']) => {
      try {
        const item = await hnStorage.addToCollection(collectionId, news);
        const cache = favoritesCache.current;
        const items = cache.get(collectionId) || [];
        if (!items.some((i) => i.newsId === news.id)) {
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
        await hnStorage.removeFromCollection(itemId);
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
    async (collectionId: string, news: HNFavoriteItem['news']) => {
      const isFavorited = await hnStorage.isInCollection(collectionId, news.id);
      if (isFavorited) {
        const item = await hnStorage.getFavoriteByNewsId(collectionId, news.id);
        if (item) await removeFromCollection(item.id, collectionId);
      } else {
        await addToCollection(collectionId, news);
      }
    },
    [addToCollection, removeFromCollection]
  );

  const isInCollection = React.useCallback(
    async (collectionId: string, newsId: number) => {
      return hnStorage.isInCollection(collectionId, newsId);
    },
    []
  );

  const getFavorites = React.useCallback((collectionId: string) => {
    return favoritesCache.current.get(collectionId) || [];
  }, []);

  const refreshFavorites = React.useCallback(async (collectionId: string) => {
    const items = await loadFavorites(collectionId);
    return items;
  }, [loadFavorites]);

  const getCollectionsContainingNews = React.useCallback(
    async (newsId: number) => {
      const checks = collections.map(async (collection) => {
        const isIn = await hnStorage.isInCollection(collection.id, newsId);
        return isIn ? collection : null;
      });
      const results = await Promise.all(checks);
      return results.filter((c): c is HNCollection => c !== null);
    },
    [collections]
  );

  return {
    collections,
    loading,
    loadingFavorites,
    error,
    loadCollections,
    loadFavorites,
    refreshFavorites,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    toggleFavorite,
    isInCollection,
    getFavorites,
    getCollectionsContainingNews,
  };
}
