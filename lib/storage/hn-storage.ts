/**
 * Hacker News 收藏存储适配器
 * 使用 localStorage 存储收藏数据
 */

import type {
  HNCollection,
  HNFavoriteItem,
  HNStorageAdapter,
} from './hn-types';

const COLLECTIONS_KEY = 'hn_collections';
const FAVORITES_KEY = 'hn_favorites';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `hn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 日期排序辅助函数（用于收藏夹）
 */
const sortCollectionsByDateDesc = (a: HNCollection, b: HNCollection) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/**
 * 日期排序辅助函数（用于收藏项）
 */
const sortFavoritesByDateDesc = (a: HNFavoriteItem, b: HNFavoriteItem) =>
  new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();

// Generic localStorage helpers
function createStorageGetter<T>(key: string, errorMsg: string): () => T[] {
  return () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error(`[HNStorage] ${errorMsg}`);
      return [];
    }
  };
}

function createStorageSetter<T>(key: string, errorMsg: string): (data: T) => void {
  return (data: T) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      console.error(`[HNStorage] ${errorMsg}`);
    }
  };
}

const getCollections = createStorageGetter<HNCollection>(COLLECTIONS_KEY, 'Failed to parse collections');
const saveCollections = createStorageSetter(COLLECTIONS_KEY, 'Failed to save collections');
const getFavorites = createStorageGetter<HNFavoriteItem>(FAVORITES_KEY, 'Failed to parse favorites');
const saveFavorites = createStorageSetter(FAVORITES_KEY, 'Failed to save favorites');

/**
 * HNStorageAdapter 实现
 */
export class HNStorageAdapterImpl implements HNStorageAdapter {
  // ========== 收藏夹 CRUD ==========

  async getAllCollections(): Promise<HNCollection[]> {
    return getCollections().sort(sortCollectionsByDateDesc);
  }

  async getCollection(id: string): Promise<HNCollection | null> {
    return getCollections().find((c) => c.id === id) || null;
  }

  async createCollection(
    name: string,
    description?: string
  ): Promise<HNCollection> {
    const collections = getCollections();
    const newCollection: HNCollection = {
      id: generateId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    collections.push(newCollection);
    saveCollections(collections);
    return newCollection;
  }

  async updateCollection(
    id: string,
    data: Partial<Pick<HNCollection, 'name' | 'description'>>
  ): Promise<HNCollection | null> {
    const collections = getCollections();
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) return null;

    collections[index] = {
      ...collections[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveCollections(collections);
    return collections[index];
  }

  async deleteCollection(id: string): Promise<boolean> {
    const collections = getCollections().filter((c) => c.id !== id);
    const favorites = getFavorites().filter((f) => f.collectionId !== id);

    saveCollections(collections);
    saveFavorites(favorites);
    return true;
  }

  // ========== 收藏项操作 ==========

  async addToCollection(
    collectionId: string,
    news: HNFavoriteItem['news']
  ): Promise<HNFavoriteItem> {
    const existing = await this.getFavoriteByNewsId(collectionId, news.id);
    if (existing) {
      return existing;
    }

    const favorites = getFavorites();
    const newItem: HNFavoriteItem = {
      id: generateId(),
      collectionId,
      newsId: news.id,
      news: { ...news },
      addedAt: new Date().toISOString(),
    };

    favorites.push(newItem);
    saveFavorites(favorites);
    return newItem;
  }

  async removeFromCollection(itemId: string): Promise<boolean> {
    const favorites = getFavorites().filter((f) => f.id !== itemId);
    saveFavorites(favorites);
    return true;
  }

  async removeFromCollectionByNewsId(
    collectionId: string,
    newsId: number
  ): Promise<boolean> {
    const favorites = getFavorites().filter(
      (f) => !(f.collectionId === collectionId && f.newsId === newsId)
    );
    saveFavorites(favorites);
    return true;
  }

  async getFavoritesByCollection(
    collectionId: string
  ): Promise<HNFavoriteItem[]> {
    return getFavorites()
      .filter((f) => f.collectionId === collectionId)
      .sort(sortFavoritesByDateDesc);
  }

  async getFavoriteByNewsId(
    collectionId: string,
    newsId: number
  ): Promise<HNFavoriteItem | null> {
    return (
      getFavorites().find(
        (f) => f.collectionId === collectionId && f.newsId === newsId
      ) || null
    );
  }

  async isInCollection(collectionId: string, newsId: number): Promise<boolean> {
    return getFavorites().some(
      (f) => f.collectionId === collectionId && f.newsId === newsId
    );
  }

  // ========== 统计 ==========

  async getCollectionCount(): Promise<number> {
    return getCollections().length;
  }

  async getFavoriteCount(collectionId: string): Promise<number> {
    return getFavorites().filter((f) => f.collectionId === collectionId).length;
  }
}

/**
 * 导出单例实例
 */
export const hnStorage = new HNStorageAdapterImpl();
