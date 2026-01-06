'use client';

/**
 * 封面生成 Hook
 * 处理提示词优化和图像生成的核心逻辑
 */

import * as React from 'react';
import type { ReferenceImage, GeneratedCover, CoverStyle } from '@/app/[locale]/tools/cover-generator/page';

interface GenerateParams {
  images: ReferenceImage[];
  prompt: string;
  style: CoverStyle;
}

interface GenerateResult {
  covers: GeneratedCover[];
}

interface UseCoverGenerationReturn {
  isOptimizing: boolean;
  isGenerating: boolean;
  optimizedPrompt: string;
  error: string | null;
  generate: (params: GenerateParams) => Promise<GenerateResult | undefined>;
  reset: () => void;
}

export function useCoverGeneration(): UseCoverGenerationReturn {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // 生成优化后的提示词
  const optimizePrompt = async (
    images: ReferenceImage[],
    prompt: string,
    style: CoverStyle
  ): Promise<string> => {
    const response = await fetch('/api/aihubmix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview-search',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的小红书封面设计师。你的任务是分析用户上传的参考图片，并结合用户需求，生成适合 Gemini 图像生成的优化提示词。

要求：
1. 分析参考图片的风格特征（色彩、构图、文案排版）
2. 结合用户描述，生成小红书风格的封面提示词
3. 提示词要用英文，简洁明了，适合 Gemini 理解
4. 融入小红书风格关键词：高清质感、氛围感、种草风
5. 如果用户提到特定风格（鲜艳/极简/暖色/冷色/活泼），要体现出来

输出格式：
只返回优化后的英文提示词，不要任何解释。`,
          },
          {
            role: 'user',
            content: `请分析参考图片并优化以下提示词：

用户需求：${prompt}
期望风格：${style}

参考图片数量：${images.length}张`,
          },
        ],
        temperature: 0.7,
        max_tokens: 65536,
        thinking: true,
      }),
    });

    if (!response.ok) {
      throw new Error('提示词优化失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return content || prompt;
  };

  // 生成封面
  const generateCovers = async (
    images: ReferenceImage[],
    prompt: string
  ): Promise<GeneratedCover[]> => {
    const response = await fetch('/api/cover-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: images.map((img) => ({ base64: img.base64 })),
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '封面生成失败');
    }

    const data = await response.json();
    return data.covers || [];
  };

  // 主生成函数
  const generate = async (params: GenerateParams): Promise<GenerateResult | undefined> => {
    const { images, prompt, style } = params;

    setError(null);
    setOptimizedPrompt('');

    try {
      // Step 1: 优化提示词
      setIsOptimizing(true);
      const optimized = await optimizePrompt(images, prompt, style);
      setOptimizedPrompt(optimized);
      setIsOptimizing(false);

      // Step 2: 生成封面
      setIsGenerating(true);
      const covers = await generateCovers(images, optimized);
      setIsGenerating(false);

      return { covers };
    } catch (err) {
      setIsOptimizing(false);
      setIsGenerating(false);

      const errorMessage = err instanceof Error ? err.message : '生成失败，请重试';
      setError(errorMessage);

      console.error('Cover generation error:', err);
      return undefined;
    }
  };

  // 重置状态
  const reset = () => {
    setIsOptimizing(false);
    setIsGenerating(false);
    setOptimizedPrompt('');
    setError(null);
  };

  return {
    isOptimizing,
    isGenerating,
    optimizedPrompt,
    error,
    generate,
    reset,
  };
}
