/**
 * 存储层类型定义
 * 定义数据结构和使用适配器接口，支持 Supabase 迁移
 */

/**
 * 优化历史记录接口
 */
export interface OptimizationHistory {
  id: string;
  userId?: string;
  originalPrompt: string;
  optimizedPrompt: string;
  modelId: string;
  modelName: string;
  stages: OptimizationStage[];
  tags?: string[];
  isFavorite?: boolean;
  totalDuration?: number; // 优化总耗时（毫秒）
  createdAt: string;
  updatedAt?: string;
}

/**
 * 单个优化阶段结果
 */
export interface OptimizationStage {
  id: string;
  name: string;
  description: string;
  input: string;
  output: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  createdAt: string;
}

/**
 * 存储适配器接口
 * 定义统一的存储操作方法
 */
export interface StorageAdapter {
  /**
   * 保存历史记录
   */
  save(history: OptimizationHistory): Promise<OptimizationHistory>;

  /**
   * 获取所有历史记录
   */
  getAll(): Promise<OptimizationHistory[]>;

  /**
   * 根据 ID 获取单条记录
   */
  getById(id: string): Promise<OptimizationHistory | null>;

  /**
   * 更新历史记录
   */
  update(id: string, data: Partial<OptimizationHistory>): Promise<OptimizationHistory | null>;

  /**
   * 删除历史记录
   */
  delete(id: string): Promise<boolean>;

  /**
   * 清空所有历史记录
   */
  clear(): Promise<boolean>;

  /**
   * 按条件搜索历史记录
   */
  search(query: SearchQuery): Promise<OptimizationHistory[]>;
}

/**
 * 搜索查询条件
 */
export interface SearchQuery {
  userId?: string;
  modelId?: string;
  tags?: string[];
  isFavorite?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * 存储事件类型
 */
export type StorageEventType = 'save' | 'delete' | 'clear' | 'update' | '*';

/**
 * 存储事件监听器
 */
export interface StorageEvent {
  type: StorageEventType;
  data?: OptimizationHistory | string;
  timestamp: number;
}

/**
 * 存储配置选项
 */
export interface StorageConfig {
  maxRecords?: number;
  encryptionKey?: string;
}
