import type { ReactNode } from 'react';

/**
 * 封面生成风格配置
 */
export interface StyleConfig {
  /** 风格唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 图标组件 */
  icon: React.ComponentType<{ className?: string }>;
  /** 风格描述 */
  description: string;
  /** 颜色配置 */
  colors: {
    /** 主色调 */
    primary: string;
    /** 辅助色 */
    secondary: string;
    /** 强调色 */
    accent: string;
    /** 背景色 */
    background: string;
    /** 文字色 */
    text: string;
  };
  /** 风格关键词（用于提示词生成） */
  keywords: string[];
  /** 氛围描述 */
  mood: string;
}

/**
 * 增强后的提示词结果
 */
export interface EnhancedPrompt {
  /** 优化后的英文提示词（用于生图） */
  text: string;
  /** 风格标签 */
  style: string;
  /** 颜色描述（用于预览展示） */
  colors: string;
  /** 布局描述 */
  layout: string;
}

/**
 * 参考图片
 */
export interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

/**
 * 生成的封面
 */
export interface GeneratedCover {
  id: string;
  url: string;
  prompt: string;
}
