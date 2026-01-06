/**
 * 小红书笔记数据类型定义
 */

/**
 * CSV 解析后的单条笔记数据
 */
export interface NoteData {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  collects?: number;
  createTime?: string;
  tags?: string[];
  category?: string;
  author?: string;
  [key: string]: unknown;
}

/**
 * CSV 解析结果
 */
export interface CSVParseResult {
  success: boolean;
  data: NoteData[];
  columns: string[];
  rowCount: number;
  error?: string;
}

/**
 * 分析指令类型
 */
export type AnalysisTemplate =
  | 'custom'
  | 'viral-features'
  | 'content-optimization'
  | 'publishing-time'
  | 'engagement-improvement';

/**
 * 预设分析模板
 */
export interface AnalysisTemplateItem {
  id: AnalysisTemplate;
  name: string;
  description: string;
  prompt: string;
}

/**
 * AI 分析请求
 */
export interface AnalysisRequest {
  data: NoteData[];
  instruction: string;
  template?: AnalysisTemplate;
}

/**
 * AI 分析结果
 */
export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  metrics: Record<string, string | number>;
}

/**
 * 分析历史记录
 */
export interface AnalysisHistory {
  id: string;
  timestamp: number;
  instruction: string;
  rowCount: number;
  result: AnalysisResult;
}
