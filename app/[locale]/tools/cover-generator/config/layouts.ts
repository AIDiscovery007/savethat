/**
 * 版式配置
 * 定义常见版式类型，用于关键词匹配和AI推断参考
 */

import {
  AlignCenterVertical,
  Columns,
  Rows,
  GridFour,
  Images,
  TextT,
} from '@phosphor-icons/react';
import type { StyleConfig } from '../types';

/**
 * 版式配置类型
 */
export interface LayoutConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  layoutType: 'centered' | 'split' | 'vertical' | 'magazine' | 'collage' | 'overlay';
  keywords: string[];  // 用于检测用户意图
  asciiExample: string;  // ASCII 示例
}

/**
 * 版式关键词检测映射
 */
export const LAYOUT_KEYWORDS: Record<string, string[]> = {
  'centered': ['标题居中', '居中', 'center', '中间', 'centered'],
  'split': ['左右分栏', '左右布局', 'split', '左图右文', '右图左文', '左右结构'],
  'vertical': ['上下结构', '上图下文', 'vertical', '下图上文', '上下排版'],
  'collage': ['拼贴', 'collage', '拼图', '多图', 'collage'],
  'magazine': ['杂志风', 'magazine', '图文混排', '杂志布局'],
  'overlay': ['叠加', 'overlay', '文字覆盖', '文字在图上', '文字叠加'],
};

/**
 * 版式配置列表
 */
export const LAYOUT_CONFIGS: LayoutConfig[] = [
  {
    id: 'centered',
    name: '居中布局',
    icon: AlignCenterVertical,
    description: '标题居中，图片在下方的经典布局',
    layoutType: 'centered',
    keywords: LAYOUT_KEYWORDS['centered'],
    asciiExample: `┌────────────────────────────────────┐
│          [大标题区域 - 居中]          │
├────────────────────────────────────┤
│                                    │
│         [主图区域 70%]              │
│         产品/人物/场景展示           │
│                                    │
├────────────────────────────────────┤
│  [底部标签区]  #话题 #品牌标签       │
└────────────────────────────────────┘`,
  },
  {
    id: 'split',
    name: '左右分栏',
    icon: Columns,
    description: '左图右文或右图左文的分栏布局',
    layoutType: 'split',
    keywords: LAYOUT_KEYWORDS['split'],
    asciiExample: `┌───────────────────┬───────────────────┐
│                   │                   │
│   [左侧图片区]     │   [右侧标题区]     │
│   (产品/人物)      │   标题文字         │
│                   │   副标题说明       │
│                   │                   │
│                   │   [底部标签]       │
└───────────────────┴───────────────────┘`,
  },
  {
    id: 'vertical',
    name: '上下结构',
    icon: Rows,
    description: '上图下文的纵向布局',
    layoutType: 'vertical',
    keywords: LAYOUT_KEYWORDS['vertical'],
    asciiExample: `┌────────────────────────────────────┐
│                                    │
│         [顶部主图区域 60%]          │
│         背景图/场景图               │
│                                    │
├────────────────────────────────────┤
│   [标题区]                          │
│   大标题文字                        │
├────────────────────────────────────┤
│   [内容区]                          │
│   副标题/简介/标签                   │
└────────────────────────────────────┘`,
  },
  {
    id: 'magazine',
    name: '杂志风',
    icon: GridFour,
    description: '图文混排的杂志风格布局',
    layoutType: 'magazine',
    keywords: LAYOUT_KEYWORDS['magazine'],
    asciiExample: `┌────────────────────────────────────┐
│  ┌─────────┐      [大标题区域]        │
│  │  图片   │                          │
│  │  A 40%  │   [副标题/说明文字]       │
│  └─────────┘                          │
├────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────┐    │
│  │  图片   │  │                 │    │
│  │  B 30%  │  │   [正文区域]    │    │
│  └─────────┘  │                 │    │
│               └─────────────────┘    │
├────────────────────────────────────┤
│      [标签/话题 #品牌 #话题]          │
└────────────────────────────────────┘`,
  },
  {
    id: 'collage',
    name: '拼贴风格',
    icon: Images,
    description: '多图拼接的创意布局',
    layoutType: 'collage',
    keywords: LAYOUT_KEYWORDS['collage'],
    asciiExample: `┌────────────────┬────────────────┐
│    ┌──────┐  │    ┌──────┐       │
│    │ 图片 │  │    │ 图片 │       │
│    │  A   │  │    │  B   │       │
│    └──────┘  │    └──────┘       │
├──────────────┼────────────────────┤
│    ┌──────┐  │    [大标题]        │
│    │ 图片 │  │    [副标题]        │
│    │  C   │  │                    │
│    └──────┘  │    [底部标签]      │
└──────────────┴────────────────────┘`,
  },
  {
    id: 'overlay',
    name: '文字叠加',
    icon: TextT,
    description: '文字覆盖在图片上的现代风格',
    layoutType: 'overlay',
    keywords: LAYOUT_KEYWORDS['overlay'],
    asciiExample: `┌────────────────────────────────────┐
│                                    │
│     [主图/背景图 全屏覆盖]          │
│                                    │
│     ┌──────────────────────────┐   │
│     │  [半透明遮罩层]           │   │
│     │                          │   │
│     │   [居中标题文字]          │   │
│     │   [副标题/说明]           │   │
│     │                          │   │
│     └──────────────────────────┘   │
│                                    │
│     [底部标签栏]                    │
└────────────────────────────────────┘`,
  },
];

/**
 * 根据关键词检测用户意图的版式ID
 */
export function detectLayoutFromPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();

  for (const [layoutId, keywords] of Object.entries(LAYOUT_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw.toLowerCase()))) {
      return layoutId;
    }
  }

  return null;
}

/**
 * 根据版式ID获取配置
 */
export function getLayoutById(id: string): LayoutConfig | undefined {
  return LAYOUT_CONFIGS.find(layout => layout.id === id);
}

/**
 * 根据风格名称获取ASCII版式描述（当用户有明确版式意图时使用）
 */
export function getLayoutAsciiForIntent(
  intent: string,
  styleConfig?: StyleConfig
): string {
  const layout = getLayoutById(intent);
  if (!layout) return '';

  return `## LAYOUT STRUCTURE (ASCII)
${layout.asciiExample}

## Composition Notes:
- Layout Type: ${layout.name}
- This is a ${layout.description}
- Adapt to style: ${styleConfig?.name || 'default'}`;
}

/**
 * 获取所有版式ID列表
 */
export function getAllLayoutIds(): string[] {
  return LAYOUT_CONFIGS.map(layout => layout.id);
}
