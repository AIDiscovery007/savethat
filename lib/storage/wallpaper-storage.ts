/**
 * 壁纸收藏夹存储适配器
 * 使用 localStorage 存储壁纸收藏数据
 */

import type {
  WallpaperCollection,
  WallpaperFavoriteItem,
  WallpaperStorageData,
  WallpaperStorageAdapter,
  WallhavenWallpaper,
} from './wallpaper-types';

const COLLECTIONS_KEY = 'wallpaper_collections';
const FAVORITES_KEY = 'wallpaper_favorites';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `wall_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 日期排序辅助函数（用于收藏夹）
 */
const sortCollectionsByDateDesc = (a: WallpaperCollection, b: WallpaperCollection) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/**
 * 日期排序辅助函数（用于收藏项）
 */
const sortFavoritesByDateDesc = (a: WallpaperFavoriteItem, b: WallpaperFavoriteItem) =>
  new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();

// Generic localStorage helpers to eliminate code duplication
function createStorageGetter<T>(key: string, errorMsg: string): () => T[] {
  return () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      console.error(`[WallpaperStorage] ${errorMsg}`);
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
      console.error(`[WallpaperStorage] ${errorMsg}`);
    }
  };
}

const getCollections = createStorageGetter<WallpaperCollection>(COLLECTIONS_KEY, 'Failed to parse collections');
const saveCollections = createStorageSetter(COLLECTIONS_KEY, 'Failed to save collections');
const getFavorites = createStorageGetter<WallpaperFavoriteItem>(FAVORITES_KEY, 'Failed to parse favorites');
const saveFavorites = createStorageSetter(FAVORITES_KEY, 'Failed to save favorites');

/**
 * WallpaperStorageAdapter 实现
 */
export class WallpaperStorageAdapterImpl implements WallpaperStorageAdapter {
  // ========== 收藏夹 CRUD ==========

  async getAllCollections(): Promise<WallpaperCollection[]> {
    return getCollections().sort(sortCollectionsByDateDesc);
  }

  async getCollection(id: string): Promise<WallpaperCollection | null> {
    return getCollections().find((c) => c.id === id) || null;
  }

  async createCollection(
    name: string,
    description?: string
  ): Promise<WallpaperCollection> {
    const collections = getCollections();
    const newCollection: WallpaperCollection = {
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
    data: Partial<Pick<WallpaperCollection, 'name' | 'description'>>
  ): Promise<WallpaperCollection | null> {
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
    // 删除收藏夹时，同时删除其下的所有收藏项
    const collections = getCollections().filter((c) => c.id !== id);
    const favorites = getFavorites().filter((f) => f.collectionId !== id);

    saveCollections(collections);
    saveFavorites(favorites);
    return true;
  }

  // ========== 收藏项操作 ==========

  async addToCollection(
    collectionId: string,
    wallpaper: WallhavenWallpaper
  ): Promise<WallpaperFavoriteItem> {
    // 检查是否已存在
    const existing = await this.getFavoriteByWallpaperId(
      collectionId,
      wallpaper.id
    );
    if (existing) {
      return existing;
    }

    const favorites = getFavorites();
    const newItem: WallpaperFavoriteItem = {
      id: generateId(),
      collectionId,
      wallpaperId: wallpaper.id,
      wallpaper: { ...wallpaper },
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

  async removeFromCollectionByWallpaperId(
    collectionId: string,
    wallpaperId: string
  ): Promise<boolean> {
    const favorites = getFavorites().filter(
      (f) => !(f.collectionId === collectionId && f.wallpaperId === wallpaperId)
    );
    saveFavorites(favorites);
    return true;
  }

  async getFavoritesByCollection(
    collectionId: string
  ): Promise<WallpaperFavoriteItem[]> {
    return getFavorites()
      .filter((f) => f.collectionId === collectionId)
      .sort(sortFavoritesByDateDesc);
  }

  async getFavoriteByWallpaperId(
    collectionId: string,
    wallpaperId: string
  ): Promise<WallpaperFavoriteItem | null> {
    return (
      getFavorites().find(
        (f) => f.collectionId === collectionId && f.wallpaperId === wallpaperId
      ) || null
    );
  }

  async isInCollection(collectionId: string, wallpaperId: string): Promise<boolean> {
    return getFavorites().some(
      (f) => f.collectionId === collectionId && f.wallpaperId === wallpaperId
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
export const wallpaperStorage = new WallpaperStorageAdapterImpl();
