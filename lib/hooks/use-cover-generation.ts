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
  const [state, setState] = React.useState({
    isOptimizing: false,
    isGenerating: false,
    optimizedPrompt: '',
    error: null as string | null,
  });

  const reset = () => setState({ isOptimizing: false, isGenerating: false, optimizedPrompt: '', error: null });

  const optimizePrompt = async (
    images: ReferenceImage[],
    prompt: string,
    styleId: string
  ): Promise<string> => {
    const styleConfig = getStyleById(styleId);
    const response = await fetch('/api/aihubmix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview-search',
        messages: [
          { role: 'system', content: buildSystemPrompt(styleConfig, styleId) },
          { role: 'user', content: buildUserPrompt(prompt, styleConfig, styleId, images.length) },
        ],
        temperature: 0.7,
        max_tokens: 65536,
        thinking: true,
      }),
    });

    if (!response.ok) throw new Error('提示词优化失败');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || prompt;
  };

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

  const generate = async (params: GenerateParams): Promise<GenerateResult | undefined> => {
    const { images, prompt, styleId } = params;

    try {
      setState(s => ({ ...s, isOptimizing: true, error: null }));
      const optimized = await optimizePrompt(images, prompt, styleId);
      setState(s => ({ ...s, isOptimizing: false, optimizedPrompt: optimized }));

      setState(s => ({ ...s, isGenerating: true }));
      const covers = await generateCovers(images, optimized);
      setState(s => ({ ...s, isGenerating: false }));

      return { covers, optimizedPrompt: optimized };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成失败，请重试';
      setState({ isOptimizing: false, isGenerating: false, optimizedPrompt: '', error: errorMessage });
      console.error('Cover generation error:', err);
      return undefined;
    }
  };

  return { ...state, generate, reset };
}
