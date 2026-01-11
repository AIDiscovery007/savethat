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
  { id: 'ski-analysis', name: '滑雪动作分析', description: '上传滑雪视频，AI 将从专业滑手角度分析动作问题并提供改进建议', path: '/tools/ski-analysis', icon: 'video', category: 'video', status: 'available', tags: ['AI', '滑雪', '动作分析', '运动'] },
  { id: 'cover-generator', name: '小红书封面生成器', description: '基于 AI 的小红书笔记封面生成工具，上传参考图并描述需求即可生成专业封面', path: '/tools/cover-generator', icon: 'image', category: 'image', status: 'experimental', tags: ['小红书', '封面', '图像生成', 'AI'] },
  { id: 'xiaohongshu-analytics', name: '小红书分析', description: '上传小红书笔记数据 CSV 文件，AI 智能分析笔记表现，提供优化建议', path: '/tools/xiaohongshu-analytics', icon: 'chart', category: 'analysis', status: 'experimental', tags: ['AI', '小红书', '数据分析', '运营'] },
  { id: 'wallhaven-gallery', name: '壁纸画廊', description: '浏览和下载 Wallhaven 精选壁纸，支持搜索、过滤和批量下载', path: '/tools/wallhaven-gallery', icon: 'image', category: 'image', status: 'available', tags: ['壁纸', 'Wallhaven', '图像', '下载'] },
  { id: 'hacker-news-daily', name: '每日资讯', description: '每天基于固定主题从 Hacker News 筛选并翻译精选内容', path: '/tools/hacker-news-daily', icon: 'translate', category: 'analysis', status: 'available', tags: ['news', '翻译', 'Hacker News', '每日'] },
  { id: 'web-translator', name: '网页翻译', description: '输入网址,AI 智能翻译网页内容为地道中文,保留原文图片', path: '/tools/web-translator', icon: 'translate', category: 'translation', status: 'available', tags: ['翻译', '网页', 'AI', '外语'] },
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
