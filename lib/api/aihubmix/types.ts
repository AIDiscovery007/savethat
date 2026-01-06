/**
 * Aihubmix API 类型定义
 * 兼容 OpenAI API 格式的聊天完成接口
 */

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * 消息内容类型
 */
export type MessageContent = string;

/**
 * 聊天消息接口
 */
export interface AihubmixMessage {
  role: MessageRole;
  content: MessageContent;
  name?: string;
}

/**
 * 聊天完成请求参数
 */
export interface AihubmixChatRequest {
  model: string;
  messages: AihubmixMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  n?: number;
  /** 是否启用 thinking 模式（扩展思考） */
  thinking?: boolean;
  /** 是否启用搜索功能 */
  search?: boolean;
}

/**
 * 聊天完成响应 Choice
 */
export interface AihubmixChoice {
  index: number;
  message: AihubmixMessage;
  finish_reason: string;
  logprobs?: unknown;
}

/**
 * 使用统计信息
 */
export interface AihubmixUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * 聊天完成响应
 */
export interface AihubmixChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AihubmixChoice[];
  usage: AihubmixUsage;
}

/**
 * 流式响应 Chunk Choice
 */
export interface AihubmixStreamChoice {
  index: number;
  delta: Partial<AihubmixMessage>;
  finish_reason: string | null;
  logprobs?: unknown;
}

/**
 * 流式响应 Chunk
 */
export interface AihubmixStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AihubmixStreamChoice[];
}

/**
 * API 错误响应
 */
export interface AihubmixError {
  error: {
    message: string;
    type: string;
    code?: string;
    param?: string;
  };
}

/**
 * 请求配置选项
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  onStream?: (chunk: AihubmixStreamChunk) => void;
}
