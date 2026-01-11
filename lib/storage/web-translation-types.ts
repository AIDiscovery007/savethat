/**
 * 网页翻译记录类型定义
 * 支持 localStorage 存储,预留 Supabase 迁移
 */

export interface WebTranslationRecord {
  id: string;
  userId?: string;           // Supabase auth 迁移预留
  originalUrl: string;
  originalTitle: string;
  originalLanguage: string;  // 识别出的原文语言
  translatedTitle: string;
  translatedContent: string; // Markdown 格式,包含内联图片
  images: Array<{
    src: string;
    alt?: string;
    position: number;        // 在文章中的位置索引
  }>;
  modelId: string;
  modelName: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;         // ISO 8601 格式
  updatedAt?: string;
}

// API 请求/响应类型
export interface WebTranslatorRequest {
  url: string;
}

export interface WebTranslatorResponse {
  success: boolean;
  data?: {
    originalTitle: string;
    originalLanguage: string;
    translatedTitle: string;
    translatedContent: string;
    images: Array<{
      src: string;
      alt?: string;
    }>;
    modelId: string;
  };
  error?: string;
}

// Storage Adapter 接口
export interface WebTranslationStorageAdapter {
  saveTranslation(record: WebTranslationRecord): Promise<void>;
  getTranslation(id: string): Promise<WebTranslationRecord | null>;
  getAllTranslations(): Promise<WebTranslationRecord[]>;
  deleteTranslation(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;
  clearAll(): Promise<void>;
  search(query: TranslationSearchQuery): Promise<WebTranslationRecord[]>;
  isUrlTranslated(url: string): Promise<boolean>;
  getTranslationByUrl(url: string): Promise<WebTranslationRecord | null>;
  addEventListener(type: string, listener: (data?: unknown) => void): () => void;
  getStats(): Promise<{ total: number; favorites: number; byLanguage: Record<string, number> }>;
}

// 搜索和筛选
export interface TranslationSearchQuery {
  query?: string;
  favoritesOnly?: boolean;
  offset?: number;
  limit?: number;
}
