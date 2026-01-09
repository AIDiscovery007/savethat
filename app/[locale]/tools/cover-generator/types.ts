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

/**
 * 批量生成配置
 */
export interface BatchGenerationConfig {
  theme: string;
  content: string; // 笔记正文
  styleId: string;
  layoutId?: string;
  images?: ReferenceImage[]; // 可选的参考图
}

/**
 * 批量生成内容分析结果
 */
export interface ContentAnalysisResult {
  suggestedImageCount: number; // 建议的图片数量（包含封面）
  coverFocus: string; // 封面的重点
  contentPages: Array<{
    index: number; // 页码，从1开始
    focus: string; // 该页面的重点
    layout: string; // 建议的布局类型
  }>;
  reasoning: string; // AI的推理说明
}

/**
 * 批量生成结果
 */
export interface BatchGenerationResult {
  cover: GeneratedCover; // 首图封面
  contentPages: GeneratedCover[]; // 内容页数组
  totalImages: number;
  analysis: ContentAnalysisResult;
}
