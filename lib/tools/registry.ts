/**
 * 工具注册表
 * 为未来的工具扩展提供统一的注册机制
 */

export type ToolIconName = 'sparkle' | 'code' | 'translate' | 'image' | 'file-text' | 'video' | 'chart' | 'game-controller';

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

export type ToolCategory = 'prompt' | 'code' | 'image' | 'text' | 'translation' | 'analysis' | 'video' | 'game';
export type ToolStatus = 'available' | 'beta' | 'experimental';

const TOOL_REGISTRY: ToolInfo[] = [
  { id: 'prompt-quiz', name: '提问挑战', description: '通过猜谜游戏训练你的提问能力，学会提出更有价值的问题', path: '/tools/prompt-quiz', icon: 'game-controller', category: 'game', status: 'available', tags: ['AI', '提问', '游戏', '训练'] },
  { id: 'prompt-trainer', name: '提问训练', description: '学习如何提出更好的问题，训练你的提问思维能力', path: '/tools/prompt-trainer', icon: 'sparkle', category: 'prompt', status: 'available', tags: ['AI', '提问', '思考', '训练'] },
  { id: 'prompt-optimizer', name: '提示词优化', description: '基于 AI 的三阶段提示词优化工具，帮助你写出更好的提示词', path: '/tools/prompt-optimizer', icon: 'sparkle', category: 'prompt', status: 'available', tags: ['AI', '提示词', '优化'] },
  { id: 'code-generator', name: '代码生成', description: '根据自然语言描述生成代码，支持多种编程语言', path: '/tools/code-generator', icon: 'code', category: 'code', status: 'beta', tags: ['AI', '代码', '编程'] },
  { id: 'text-translator', name: '智能翻译', description: '支持多种语言之间的智能翻译，保持原文风格', path: '/tools/text-translator', icon: 'translate', category: 'translation', status: 'experimental', tags: ['AI', '翻译', '语言'] },
  { id: 'image-generator', name: '图像生成', description: '根据描述生成图像，支持多种风格', path: '/tools/image-generator', icon: 'image', category: 'image', status: 'experimental', tags: ['AI', '图像', '设计'] },
  { id: 'text-summarizer', name: '文本摘要', description: '快速生成文章、文档的摘要', path: '/tools/text-summarizer', icon: 'file-text', category: 'text', status: 'experimental', tags: ['AI', '摘要', '文本'] },
  { id: 'ski-analysis', name: '滑雪动作分析', description: '上传滑雪视频，AI 将从专业滑手角度分析动作问题并提供改进建议', path: '/tools/ski-analysis', icon: 'video', category: 'video', status: 'available', tags: ['AI', '滑雪', '动作分析', '运动'] },
  { id: 'cover-generator', name: '小红书封面生成器', description: '基于 AI 的小红书笔记封面生成工具，上传参考图并描述需求即可生成专业封面', path: '/tools/cover-generator', icon: 'image', category: 'image', status: 'experimental', tags: ['小红书', '封面', '图像生成', 'AI'] },
  { id: 'xiaohongshu-analytics', name: '小红书分析', description: '上传小红书笔记数据 CSV 文件，AI 智能分析笔记表现，提供优化建议', path: '/tools/xiaohongshu-analytics', icon: 'chart', category: 'analysis', status: 'experimental', tags: ['AI', '小红书', '数据分析', '运营'] },
  { id: 'wallhaven-gallery', name: '壁纸画廊', description: '浏览和下载 Wallhaven 精选壁纸，支持搜索、过滤和批量下载', path: '/tools/wallhaven-gallery', icon: 'image', category: 'image', status: 'available', tags: ['壁纸', 'Wallhaven', '图像', '下载'] },
];

// Helper to find tools by a property
const findTool = <K extends keyof ToolInfo>(key: K, value: string): ToolInfo | undefined =>
  TOOL_REGISTRY.find(tool => tool[key] === value);

// Query helpers
export const getToolById = (id: string) => findTool('id', id);
export const getToolByPath = (path: string) => findTool('path', path);
export const getAllTools = () => TOOL_REGISTRY;
export const getToolsByCategory = (category: ToolCategory) => TOOL_REGISTRY.filter(tool => tool.category === category);
export const getToolsByStatus = (status: ToolStatus) => TOOL_REGISTRY.filter(tool => tool.status === status);
export const getAllCategories = () => [...new Set(TOOL_REGISTRY.map(tool => tool.category))];

export function searchTools(query: string): ToolInfo[] {
  const lower = query.toLowerCase();
  return TOOL_REGISTRY.filter(tool =>
    tool.name.toLowerCase().includes(lower) ||
    tool.description.toLowerCase().includes(lower) ||
    tool.tags?.some(tag => tag.toLowerCase().includes(lower))
  );
}
