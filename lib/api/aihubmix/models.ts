/**
 * 模型配置列表
 * 定义可用的 AI 模型及其配置信息
 */

/**
 * 模型提供商类型
 */
export type ModelProvider = 'Google' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Perplexity';

/**
 * 模型信息接口
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  defaultTemperature: number;
  pricing?: {
    inputPer1M: number;
    outputPer1M: number;
  };
}

/**
 * 可用模型列表
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2-pro',
    name: 'Gemini 2.0 Pro',
    provider: 'Google',
    description: 'Google 最新一代多模态大模型，支持超长上下文和复杂推理',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Google 高效快速模型，适合高频调用和实时应用',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Google 多模态大模型，支持超长上下文窗口',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Google 轻量级快速模型，适合高频调用',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI 旗舰多模态模型，平衡性能与速度',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 5,
      outputPer1M: 15,
    },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'OpenAI 轻量级模型，性价比高',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0.15,
      outputPer1M: 0.6,
    },
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'OpenAI',
    description: 'OpenAI 推理模型，擅长复杂问题分析',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    defaultTemperature: 1,
    pricing: {
      inputPer1M: 15,
      outputPer1M: 60,
    },
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    description: 'OpenAI 轻量推理模型，平衡性能与成本',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    defaultTemperature: 1,
    pricing: {
      inputPer1M: 1.1,
      outputPer1M: 4.4,
    },
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    description: 'Anthropic 平衡型模型，优秀的编程和写作能力',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 3,
      outputPer1M: 15,
    },
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Anthropic 高性能模型，优秀的指令遵循能力',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 3,
      outputPer1M: 15,
    },
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Anthropic 快速模型，适合简单任务',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0.25,
      outputPer1M: 1.25,
    },
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    description: 'DeepSeek 通用对话模型',
    contextWindow: 64000,
    maxOutputTokens: 4096,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0.14,
      outputPer1M: 0.28,
    },
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    provider: 'DeepSeek',
    description: 'DeepSeek 推理模型，擅长复杂推理任务',
    contextWindow: 64000,
    maxOutputTokens: 4096,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0.55,
      outputPer1M: 2.19,
    },
  },
  {
    id: 'sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    description: 'Perplexity 搜索增强模型',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 3,
      outputPer1M: 3,
    },
  },
  {
    id: 'sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'Perplexity',
    description: 'Perplexity 专业搜索增强模型',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 40,
      outputPer1M: 40,
    },
  },
];

/**
 * 默认模型 ID
 */
export const DEFAULT_MODEL_ID = 'gpt-4o-mini';

/**
 * 根据模型 ID 获取模型信息
 */
export function getModelById(modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}

/**
 * 根据提供商获取模型列表
 */
export function getModelsByProvider(provider: ModelProvider): ModelInfo[] {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
}

/**
 * 获取所有提供商列表
 */
export function getAllProviders(): ModelProvider[] {
  const providers = new Set(AVAILABLE_MODELS.map(model => model.provider));
  return Array.from(providers);
}

/**
 * 按提供商分组的模型列表
 */
export function getModelsGroupedByProvider(): Record<ModelProvider, ModelInfo[]> {
  return AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<ModelProvider, ModelInfo[]>);
}
