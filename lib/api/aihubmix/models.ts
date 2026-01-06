/**
 * 模型配置列表
 * 定义可用的 AI 模型及其配置信息
 * 使用 Aihubmix SDK 支持的模型 ID 格式
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
  /** 是否支持 thinking 模式（扩展思考） */
  supportsThinking?: boolean;
  /** 是否支持搜索功能 */
  supportsSearch?: boolean;
}

/**
 * 可用模型列表
 * 模型 ID 使用 Aihubmix SDK 要求的格式
 * 参考: https://docs.aihubmix.com/cn/api/AISDK
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenAI
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
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'OpenAI',
    description: 'OpenAI 高效推理模型',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 1.1,
      outputPer1M: 4.4,
    },
    supportsThinking: true,
  },
  // Anthropic - 需要使用带版本日期的格式
  {
    id: 'claude-3-7-sonnet-20250219',
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
    id: 'claude-3-5-sonnet-20241022',
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
  // Google
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    description: 'Google 最新一代旗舰模型，性能强大',
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
    supportsThinking: true,
  },
  {
    id: 'gemini-3-flash-preview-search',
    name: 'Gemini 3 Flash Search',
    provider: 'Google',
    description: 'Google 高效快速模型，支持 thinking 模式和 web 搜索',
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0.5,
      outputPer1M: 3,
    },
    supportsThinking: true,
    supportsSearch: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Google 高效快速模型，适合高频调用',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Google 最新一代高效模型',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    defaultTemperature: 0.7,
    pricing: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },
  // DeepSeek
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
  // Perplexity
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

/**
 * 检查模型是否支持 thinking 模式
 */
export function supportsThinkingMode(modelId: string): boolean {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.supportsThinking ?? false;
}

/**
 * 检查模型是否支持搜索功能
 */
export function supportsSearchMode(modelId: string): boolean {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.supportsSearch ?? false;
}
