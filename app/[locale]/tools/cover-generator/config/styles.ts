import {
  Sparkle,
  Palette,
  Sun,
  Snowflake,
  Confetti,
  Brain,
  Aperture,
  Cube,
  Heart,
} from '@phosphor-icons/react';
import type { StyleConfig } from '../types';

/**
 * 9 种封面风格的完整配置
 */
export const COVER_STYLES: StyleConfig[] = [
  {
    id: 'vibrant',
    name: '鲜艳风格',
    icon: Sparkle,
    description: '色彩饱和度高，视觉冲击力强',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFE66D',
      accent: '#4ECDC4',
      background: '#FFFFFF',
      text: '#2D3436',
    },
    keywords: [
      'vibrant colors',
      'high saturation',
      'bold contrast',
      'eye-catching',
      'energetic',
      'pop style',
      'colorful',
    ],
    mood: 'Energetic and attention-grabbing with bold colors',
  },
  {
    id: 'minimal',
    name: '极简风格',
    icon: Palette,
    description: '简约干净，留白艺术',
    colors: {
      primary: '#2D3436',
      secondary: '#636E72',
      accent: '#B2BEC3',
      background: '#FAFAFA',
      text: '#2D3436',
    },
    keywords: [
      'minimalist',
      'clean white background',
      'simple',
      'plenty of whitespace',
      'elegant',
      'understated',
      'sophisticated',
    ],
    mood: 'Clean and sophisticated with generous whitespace',
  },
  {
    id: 'warm',
    name: '暖色风格',
    icon: Sun,
    description: '温暖柔和，温馨氛围',
    colors: {
      primary: '#E17055',
      secondary: '#FDCB6E',
      accent: '#FFEAA7',
      background: '#FFF9F0',
      text: '#6E4C30',
    },
    keywords: [
      'warm tones',
      'soft orange and yellow',
      'cozy',
      'comfortable',
      'gentle',
      'inviting',
      'sunny',
    ],
    mood: 'Warm and inviting with soft orange and yellow tones',
  },
  {
    id: 'cool',
    name: '冷色风格',
    icon: Snowflake,
    description: '清爽冷静，专业感',
    colors: {
      primary: '#0984E3',
      secondary: '#74B9FF',
      accent: '#81ECEC',
      background: '#F0F8FF',
      text: '#2C3E50',
    },
    keywords: [
      'cool tones',
      'blue and cyan',
      'professional',
      'fresh',
      'crisp',
      'clean',
      'tech-inspired',
    ],
    mood: 'Professional and fresh with cool blue tones',
  },
  {
    id: 'playful',
    name: '活泼风格',
    icon: Confetti,
    description: '有趣生动，年轻活力',
    colors: {
      primary: '#A855F7',
      secondary: '#EC4899',
      accent: '#FACC15',
      background: '#FDF4FF',
      text: '#4C1D95',
    },
    keywords: [
      'playful',
      'fun and lively',
      'youthful',
      'creative',
      'dynamic',
      'colorful',
      'whimsical',
    ],
    mood: 'Fun and creative with vibrant purple and pink',
  },
  // 新增的4种风格（来自文档框架）
  {
    id: 'second-brain',
    name: 'Second Brain',
    icon: Brain,
    description: '黑白灰+橙色点缀，极简高效',
    colors: {
      primary: '#FF6B35',
      secondary: '#2D3436',
      accent: '#636E72',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    keywords: [
      'minimalist black white gray',
      'orange accent',
      'clean typography',
      'modern',
      'efficient',
      'professional',
      'high contrast',
    ],
    mood: 'Minimalist and efficient with black/white/gray and orange pop',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: Aperture,
    description: '奶油橙紫渐变，优雅精致',
    colors: {
      primary: '#C9A7EB',
      secondary: '#F5BDE2',
      accent: '#FFB347',
      background: '#FEFDF8',
      text: '#4A3F55',
    },
    keywords: [
      'warm cream gradient',
      'soft purple and orange',
      'elegant',
      'sophisticated',
      'gentle',
      'refined',
      'artistic',
    ],
    mood: 'Elegant and refined with warm cream and purple tones',
  },
  {
    id: 'tech-future',
    name: '科技未来风',
    icon: Cube,
    description: '深蓝青色渐变，未来科技感',
    colors: {
      primary: '#00D4FF',
      secondary: '#7B61FF',
      accent: '#00C9A7',
      background: '#0A1628',
      text: '#E8F4FD',
    },
    keywords: [
      'dark blue gradient',
      'cyan neon',
      'futuristic',
      'tech-inspired',
      'digital',
      'sleek',
      'modern technology',
    ],
    mood: 'Futuristic and tech-inspired with dark blue and cyan neon',
  },
  {
    id: 'warm-life',
    name: '温暖生活风',
    icon: Heart,
    description: '米色粉色系，温馨治愈',
    colors: {
      primary: '#F4A9A8',
      secondary: '#F9E4D8',
      accent: '#FFD1A9',
      background: '#FFF8F5',
      text: '#8B6B5C',
    },
    keywords: [
      'warm beige and pink',
      'cozy',
      'comforting',
      'soft and gentle',
      'lifestyle',
      'healing',
      'nostalgic',
    ],
    mood: 'Warm and comforting with soft beige and pink tones',
  },
];

/**
 * 根据风格ID获取风格配置
 */
export function getStyleById(id: string): StyleConfig | undefined {
  return COVER_STYLES.find((style) => style.id === id);
}

/**
 * 获取所有风格ID列表
 */
export function getAllStyleIds(): string[] {
  return COVER_STYLES.map((style) => style.id);
}
