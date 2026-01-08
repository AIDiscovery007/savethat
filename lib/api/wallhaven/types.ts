/**
 * Wallhaven API 类型定义
 */

/**
 * 壁纸数据结构
 */
export interface WallhavenWallpaper {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: 'sfw' | 'sketchy' | 'nsfw';
  category: 'general' | 'anime' | 'people';
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  tags: WallhavenTag[];
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
  /**
   * 原图路径（仅在详情接口返回）
   */
  path?: string;
  /**
   * 实际文件 URL（仅在详情接口返回，已废弃，使用 path）
   */
  file?: {
    url: string;
    size: number;
  };
}

/**
 * 标签结构
 */
export interface WallhavenTag {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category: string;
  purity: 'sfw' | 'sketchy' | 'nsfw';
}

/**
 * 搜索参数
 */
export interface WallhavenSearchParams {
  /** 搜索关键词 */
  q?: string;
  /** 分类: 110=general, 010=anime, 100=people */
  categories?: string;
  /** 纯度: 100=sfw, 010=sketchy, 001=nsfw */
  purity?: string;
  /** 排序方式 */
  sorting?: 'date_added' | 'relevance' | 'random' | 'views' | 'toplist';
  /** 排序方向 */
  order?: 'desc' | 'asc';
  /** 页码 */
  page?: number;
  /** 每页数量 (默认24, 最大24) */
  limit?: number;
}

/**
 * 搜索响应
 */
export interface WallhavenSearchResponse {
  data: WallhavenWallpaper[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string;
    seed: string | null;
  };
}

/**
 * 批量下载请求
 */
export interface BatchDownloadRequest {
  ids: string[];
}

/**
 * 批量下载响应（流式）
 */
export interface BatchDownloadResponse {
  filename: string;
  done: boolean;
}
