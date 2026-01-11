/**
 * Hacker News 收藏相关类型定义
 */

export interface HNCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HNFavoriteItem {
  id: string;
  collectionId: string;
  newsId: number;
  news: {
    id: number;
    title: string;
    url: string;
    domain: string;
    score: number;
    by: string;
    time: number;
    summary: string;
  };
  addedAt: string;
}

export interface HNStorageAdapter {
  // Collection CRUD
  getAllCollections(): Promise<HNCollection[]>;
  getCollection(id: string): Promise<HNCollection | null>;
  createCollection(name: string, description?: string): Promise<HNCollection>;
  updateCollection(id: string, data: Partial<Pick<HNCollection, 'name' | 'description'>>): Promise<HNCollection | null>;
  deleteCollection(id: string): Promise<boolean>;

  // Favorite operations
  addToCollection(collectionId: string, news: HNFavoriteItem['news']): Promise<HNFavoriteItem>;
  removeFromCollection(itemId: string): Promise<boolean>;
  removeFromCollectionByNewsId(collectionId: string, newsId: number): Promise<boolean>;
  getFavoritesByCollection(collectionId: string): Promise<HNFavoriteItem[]>;
  getFavoriteByNewsId(collectionId: string, newsId: number): Promise<HNFavoriteItem | null>;
  isInCollection(collectionId: string, newsId: number): Promise<boolean>;

  // Stats
  getCollectionCount(): Promise<number>;
  getFavoriteCount(collectionId: string): Promise<number>;
}
