/**
 * 壁纸收藏夹类型定义
 * 支持 localStorage 存储，后续可迁移到 Supabase
 */

import type { WallhavenWallpaper } from '@/lib/api/wallhaven/types';

// 重新导出 WallhavenWallpaper 以便其他模块使用
export type { WallhavenWallpaper } from '@/lib/api/wallhaven/types';

/**
 * 收藏夹
 */
export interface WallpaperCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 收藏项
 */
export interface WallpaperFavoriteItem {
  id: string;
  collectionId: string;
  wallpaperId: string;
  wallpaper: WallhavenWallpaper;
  addedAt: string;
}

/**
 * 收藏夹存储数据结构
 */
export interface WallpaperStorageData {
  collections: WallpaperCollection[];
  favorites: WallpaperFavoriteItem[];
}

/**
 * 收藏夹操作方法
 */
export interface WallpaperStorageAdapter {
  // 收藏夹 CRUD
  getAllCollections(): Promise<WallpaperCollection[]>;
  getCollection(id: string): Promise<WallpaperCollection | null>;
  createCollection(name: string, description?: string): Promise<WallpaperCollection>;
  updateCollection(id: string, data: Partial<Pick<WallpaperCollection, 'name' | 'description'>>): Promise<WallpaperCollection | null>;
  deleteCollection(id: string): Promise<boolean>;

  // 收藏项操作
  addToCollection(collectionId: string, wallpaper: WallhavenWallpaper): Promise<WallpaperFavoriteItem>;
  removeFromCollection(itemId: string): Promise<boolean>;
  removeFromCollectionByWallpaperId(collectionId: string, wallpaperId: string): Promise<boolean>;
  getFavoritesByCollection(collectionId: string): Promise<WallpaperFavoriteItem[]>;
  getFavoriteByWallpaperId(collectionId: string, wallpaperId: string): Promise<WallpaperFavoriteItem | null>;
  isInCollection(collectionId: string, wallpaperId: string): Promise<boolean>;

  // 统计
  getCollectionCount(): Promise<number>;
  getFavoriteCount(collectionId: string): Promise<number>;
}

/**
 * 收藏夹创建参数
 */
export interface CreateCollectionParams {
  name: string;
  description?: string;
}

/**
 * 收藏夹更新参数
 */
export interface UpdateCollectionParams {
  name?: string;
  description?: string;
}
