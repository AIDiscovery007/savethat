'use client';

/**
 * 封面生成 Hook
 * 处理提示词优化和图像生成的核心逻辑
 */

import * as React from 'react';
import { getStyleById } from '@/app/[locale]/tools/cover-generator/config/styles';
import type {
  ReferenceImage,
  GeneratedCover,
  StyleConfig,
} from '@/app/[locale]/tools/cover-generator/types';

interface GenerateParams {
  images: ReferenceImage[];
  prompt: string;
  styleId: string;
}

interface GenerateResult {
  covers: GeneratedCover[];
  optimizedPrompt?: string;
}

interface UseCoverGenerationReturn {
  isOptimizing: boolean;
  isGenerating: boolean;
  optimizedPrompt: string;
  error: string | null;
  generate: (params: GenerateParams) => Promise<GenerateResult | undefined>;
  reset: () => void;
}

/**
 * 构建增强的 System Prompt
 */
function buildSystemPrompt(styleConfig: StyleConfig | undefined, styleId: string): string {
  const basePrompt = `You are a professional Xiaohongshu (Chinese lifestyle platform) cover designer.
Your task is to analyze reference images and user requirements, then generate optimized prompts for Gemini image generation.

## KEY PRINCIPLES:
1. Analyze reference images for style characteristics (colors, composition, layout)
2. Generate prompts that match the specific style requirements
3. Use English, be concise yet detailed enough for Gemini to understand
4. Include Xiaohongshu-specific keywords: high-quality texture, atmospheric, appealing to viewers
5. Output only the optimized English prompt, no explanations

## STYLE GUIDANCE:
`;

  const styleSection = styleConfig
    ? `Target Style: ${styleConfig.name}
Style Description: ${styleConfig.mood}
Color Scheme: ${styleConfig.colors.primary} (primary), ${styleConfig.colors.secondary} (secondary), ${styleConfig.colors.accent} (accent), ${styleConfig.colors.background} (background)
Keywords to include: ${styleConfig.keywords.join(', ')}`
    : `Custom style ID: ${styleId}`;

  const compositionSection = `

## COMPOSITION RULES:
- Use vertical 9:16 aspect ratio (Xiaohongshu standard)
- Bold, readable title text that catches attention
- Clear visual hierarchy with dominant headline
- Strategic use of negative space
- Eye-catching data points or numbers highlighted
- Clean, modern aesthetic that works for Chinese social media`;

  const outputSection = `

## OUTPUT FORMAT:
Return ONLY the optimized English prompt text, suitable for direct use in Gemini image generation.
The prompt should describe the overall visual, not individual elements.`;

  return basePrompt + styleSection + compositionSection + outputSection;
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(
  userPrompt: string,
  styleConfig: StyleConfig | undefined,
  styleId: string,
  imageCount: number
): string {
  const styleInfo = styleConfig
    ? `Target Style: ${styleConfig.name}
Mood: ${styleConfig.mood}
Colors: ${styleConfig.colors.primary}, ${styleConfig.colors.secondary}, ${styleConfig.colors.accent}`
    : `Style ID: ${styleId}`;

  return `## User Requirements:
${userPrompt}

## Style Details:
${styleInfo}

## Reference Images:
${imageCount} image(s) provided as reference

## Task:
Generate an optimized English prompt for Xiaohongshu cover generation that:
1. Incorporates the style characteristics
2. Creates an eye-catching, scroll-stopping design
3. Works well on mobile (9:16 vertical format)
4. Includes text/title elements that would grab attention
5. Maintains the reference image's aesthetic qualities`;
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
    styleId: string
  ): Promise<string> => {
    const styleConfig = getStyleById(styleId);
    const systemPrompt = buildSystemPrompt(styleConfig, styleId);
    const userPromptText = buildUserPrompt(prompt, styleConfig, styleId, images.length);

    const response = await fetch('/api/aihubmix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview-search',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPromptText,
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
    const { images, prompt, styleId } = params;

    setError(null);
    setOptimizedPrompt('');

    try {
      // Step 1: 优化提示词
      setIsOptimizing(true);
      const optimized = await optimizePrompt(images, prompt, styleId);
      setOptimizedPrompt(optimized);
      setIsOptimizing(false);

      // Step 2: 生成封面
      setIsGenerating(true);
      const covers = await generateCovers(images, optimized);
      setIsGenerating(false);

      return { covers, optimizedPrompt: optimized };
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
