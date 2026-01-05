/**
 * 工具注册表
 * 为未来的工具扩展提供统一的注册机制
 */

/**
 * 工具图标类型
 */
export type ToolIconName =
  | 'sparkle'
  | 'code'
  | 'translate'
  | 'image'
  | 'file-text'
  | 'video';

/**
 * 工具信息接口
 */
export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: ToolIconName;
  category: ToolCategory;
  status: ToolStatus;
  tags?: string[];
}

/**
 * 工具分类
 */
export type ToolCategory =
  | 'prompt'
  | 'code'
  | 'image'
  | 'text'
  | 'translation'
  | 'analysis'
  | 'video';

/**
 * 工具状态
 */
export type ToolStatus = 'available' | 'beta' | 'experimental';

/**
 * 工具注册表
 */
export const TOOL_REGISTRY: ToolInfo[] = [
  {
    id: 'prompt-optimizer',
    name: '提示词优化',
    description: '基于 AI 的三阶段提示词优化工具，帮助你写出更好的提示词',
    path: '/tools/prompt-optimizer',
    icon: 'sparkle',
    category: 'prompt',
    status: 'available',
    tags: ['AI', '提示词', '优化'],
  },
  {
    id: 'code-generator',
    name: '代码生成',
    description: '根据自然语言描述生成代码，支持多种编程语言',
    path: '/tools/code-generator',
    icon: 'code',
    category: 'code',
    status: 'beta',
    tags: ['AI', '代码', '编程'],
  },
  {
    id: 'text-translator',
    name: '智能翻译',
    description: '支持多种语言之间的智能翻译，保持原文风格',
    path: '/tools/text-translator',
    icon: 'translate',
    category: 'translation',
    status: 'experimental',
    tags: ['AI', '翻译', '语言'],
  },
  {
    id: 'image-generator',
    name: '图像生成',
    description: '根据描述生成图像，支持多种风格',
    path: '/tools/image-generator',
    icon: 'image',
    category: 'image',
    status: 'experimental',
    tags: ['AI', '图像', '设计'],
  },
  {
    id: 'text-summarizer',
    name: '文本摘要',
    description: '快速生成文章、文档的摘要',
    path: '/tools/text-summarizer',
    icon: 'file-text',
    category: 'text',
    status: 'experimental',
    tags: ['AI', '摘要', '文本'],
  },
  {
    id: 'ski-analysis',
    name: '滑雪动作分析',
    description: '上传滑雪视频，AI 将从专业滑手角度分析动作问题并提供改进建议',
    path: '/tools/ski-analysis',
    icon: 'video',
    category: 'video',
    status: 'available',
    tags: ['AI', '滑雪', '动作分析', '运动'],
  },
];

/**
 * 根据 ID 获取工具信息
 */
export function getToolById(id: string): ToolInfo | undefined {
  return TOOL_REGISTRY.find(tool => tool.id === id);
}

/**
 * 根据路径获取工具信息
 */
export function getToolByPath(path: string): ToolInfo | undefined {
  return TOOL_REGISTRY.find(tool => tool.path === path);
}

/**
 * 获取所有工具
 */
export function getAllTools(): ToolInfo[] {
  return TOOL_REGISTRY;
}

/**
 * 获取指定分类的工具
 */
export function getToolsByCategory(category: ToolCategory): ToolInfo[] {
  return TOOL_REGISTRY.filter(tool => tool.category === category);
}

/**
 * 获取指定状态的工具
 */
export function getToolsByStatus(status: ToolStatus): ToolInfo[] {
  return TOOL_REGISTRY.filter(tool => tool.status === status);
}

/**
 * 获取分类列表
 */
export function getAllCategories(): ToolCategory[] {
  const categories = new Set(TOOL_REGISTRY.map(tool => tool.category));
  return Array.from(categories);
}

/**
 * 搜索工具
 */
export function searchTools(query: string): ToolInfo[] {
  const lowerQuery = query.toLowerCase();
  return TOOL_REGISTRY.filter(
    tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
