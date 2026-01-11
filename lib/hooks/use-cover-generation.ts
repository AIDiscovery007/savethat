'use client';

import * as React from 'react';
import { getStyleById } from '@/app/[locale]/tools/cover-generator/config/styles';
import {
  detectLayoutFromPrompt,
  getLayoutAsciiForIntent,
} from '@/app/[locale]/tools/cover-generator/config/layouts';
import type {
  ReferenceImage,
  GeneratedCover,
  StyleConfig,
  BatchGenerationConfig,
  BatchGenerationResult,
} from '@/app/[locale]/tools/cover-generator/types';
import { callAihubmix, extractContent } from './use-aihubmix';

interface GenerateParams {
  images: ReferenceImage[];
  prompt: string;
  styleId: string;
}

interface GenerateResult {
  covers: GeneratedCover[];
  optimizedPrompt?: string;
  layoutPrompt?: string;
}

interface UseCoverGenerationReturn {
  isOptimizing: boolean;
  isGenerating: boolean;
  optimizedPrompt: string;
  error: string | null;
  generate: (params: GenerateParams) => Promise<GenerateResult | undefined>;
  generateBatch: (params: BatchGenerationConfig) => Promise<BatchGenerationResult | undefined>;
  reset: () => void;
}

type GenerationState = Pick<UseCoverGenerationReturn, 'isOptimizing' | 'isGenerating' | 'error'> & {
  optimizedPrompt: string;
};

async function generateLayoutPrompt(
  theme: string,
  userIntent: string | null,
  imageCount: number,
  styleName?: string
): Promise<string> {
  const content = await callAihubmix({
    model: 'gemini-3-flash-preview-search',
    messages: [
      {
        role: 'system',
        content: `You are a professional layout designer for Xiaohongshu covers.
Generate a precise ASCII layout description using standard box-drawing characters (┌ ┐ └ ┘ │ ─).
Output ONLY the ASCII layout, no explanations, no markdown code blocks.`,
      },
      {
        role: 'user',
        content: `Theme: ${theme}
User Intent: ${userIntent || 'auto-detect appropriate layout based on theme'}
Style: ${styleName || 'default'}
Reference Images: ${imageCount} image(s)}

Generate an ASCII layout structure that:
1. Uses 9:16 vertical ratio (Xiaohongshu standard)
2. Follows the user's intent or auto-selects best fit layout
3. Clearly marks content areas with text descriptions in brackets
4. Uses proportional border widths to show element sizes
5. Include main title area, main image area, and tag area

Example format:
┌────────────────────────────────────┐
│       [Title Area - Centered]      │
├────────────────────────────────────┤
│                                    │
│         [Main Image 70%]           │
│         Product/Person Scene       │
│                                    │
├────────────────────────────────────┤
│  [Tags] #topic #brand              │
└────────────────────────────────────┘`,
      },
    ],
    temperature: 0.3,
    maxTokens: 65536,
    thinking: true,
  });

  return content
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/```(?:ascii)?\n?/g, '')
    .replace(/```/g, '')
    .trim();
}

function buildSystemPrompt(styleConfig: StyleConfig | undefined, styleId: string, layoutPrompt?: string): string {
  const styleSection = styleConfig
    ? `Target Style: ${styleConfig.name}
Style Description: ${styleConfig.mood}
Color Scheme: ${styleConfig.colors.primary} (primary), ${styleConfig.colors.secondary} (secondary), ${styleConfig.colors.accent} (accent), ${styleConfig.colors.background} (background)
Keywords to include: ${styleConfig.keywords.join(', ')}`
    : `Custom style ID: ${styleId}`;

  const compositionSection = layoutPrompt
    ? `

## LAYOUT STRUCTURE (ASCII)
${layoutPrompt}

## COMPOSITION RULES:
- Follow the ASCII layout structure precisely
- Maintain 9:16 Xiaohongshu vertical ratio
- Bold, readable title text that catches attention
- Clear visual hierarchy with dominant headline
- Strategic use of negative space
- Eye-catching data points or numbers highlighted
- Clean, modern aesthetic that works for Chinese social media`
    : `

## COMPOSITION RULES:
- Use vertical 9:16 aspect ratio (Xiaohongshu standard)
- Bold, readable title text that catches attention
- Clear visual hierarchy with dominant headline
- Strategic use of negative space
- Eye-catching data points or numbers highlighted
- Clean, modern aesthetic that works for Chinese social media`;

  return `You are a professional Xiaohongshu (Chinese lifestyle platform) cover designer.
Your task is to analyze reference images and user requirements, then generate optimized prompts for Gemini image generation.

## KEY PRINCIPLES:
1. Analyze reference images for style characteristics (colors, composition, layout)
2. Generate prompts that match the specific style requirements
3. Use English, be concise yet detailed enough for Gemini to understand
4. Include Xiaohongshu-specific keywords: high-quality texture, atmospheric, appealing to viewers
5. Output only the optimized English prompt, no explanations

## STYLE GUIDANCE:
${styleSection}${compositionSection}

## OUTPUT FORMAT:
Return ONLY the optimized English prompt text, suitable for direct use in Gemini image generation.
The prompt should describe the overall visual, not individual elements.`;
}

function buildUserPrompt(
  userPrompt: string,
  styleConfig: StyleConfig | undefined,
  styleId: string,
  imageCount: number,
  layoutIntent?: string | null
): string {
  return `## User Requirements:
${userPrompt}

## Style Details:
${styleConfig
  ? `Target Style: ${styleConfig.name}
Mood: ${styleConfig.mood}
Colors: ${styleConfig.colors.primary}, ${styleConfig.colors.secondary}, ${styleConfig.colors.accent}`
  : `Style ID: ${styleId}`}

## Layout Intent:
${layoutIntent ? `Layout Intent: ${layoutIntent} (detected from user prompt)` : 'Layout Intent: Auto-detect based on theme'}

## Reference Images:
${imageCount} image(s) provided as reference

## Task:
Generate an optimized English prompt for Xiaohongshu cover generation that:
1. Incorporates the style characteristics
2. Follows the detected or auto-selected layout structure
3. Creates an eye-catching, scroll-stopping design
4. Works well on mobile (9:16 vertical format)
5. Includes text/title elements that would grab attention
6. Maintains the reference image's aesthetic qualities`;
}

async function callCoverGenerator(images: ReferenceImage[], prompt: string): Promise<GeneratedCover[]> {
  const response = await fetch('/api/cover-generator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: images.map(img => ({ base64: img.base64 })),
      prompt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '封面生成失败');
  }

  const data = await response.json();
  return data.covers || [];
}

export function useCoverGeneration(): UseCoverGenerationReturn {
  const [state, setState] = React.useState<GenerationState>({
    isOptimizing: false,
    isGenerating: false,
    optimizedPrompt: '',
    error: null,
  });

  const reset = () => setState({ isOptimizing: false, isGenerating: false, optimizedPrompt: '', error: null });

  const setLoading = (loading: Partial<GenerationState>) =>
    setState(prev => ({ ...prev, ...loading, error: null }));

  const optimizePrompt = async (
    images: ReferenceImage[],
    prompt: string,
    styleId: string
  ): Promise<{ optimized: string; layoutPrompt: string }> => {
    const styleConfig = getStyleById(styleId);
    const userLayoutIntent = detectLayoutFromPrompt(prompt);

    let layoutPrompt = userLayoutIntent
      ? getLayoutAsciiForIntent(userLayoutIntent, styleConfig) || ''
      : await generateLayoutPrompt(prompt, userLayoutIntent, images.length, styleConfig?.name);

    const systemMsg = buildSystemPrompt(styleConfig, styleId, layoutPrompt || undefined);
    const userMsg = buildUserPrompt(prompt, styleConfig, styleId, images.length, userLayoutIntent);
    const optimized = await callAihubmix({
      model: 'gemini-3-flash-preview-search',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.7,
      maxTokens: 65536,
      thinking: true,
    });

    return { optimized, layoutPrompt };
  };

  const generate = async (params: GenerateParams): Promise<GenerateResult | undefined> => {
    const { images, prompt, styleId } = params;

    try {
      setLoading({ isOptimizing: true });
      const { optimized, layoutPrompt } = await optimizePrompt(images, prompt, styleId);
      setState(prev => ({ ...prev, isOptimizing: false, optimizedPrompt: optimized }));

      setLoading({ isGenerating: true });
      const covers = await generateCovers(images, optimized);
      setState(prev => ({ ...prev, isGenerating: false }));

      return { covers, optimizedPrompt: optimized, layoutPrompt };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成失败，请重试';
      setState(prev => ({ ...prev, isOptimizing: false, isGenerating: false, error: errorMessage }));
      console.error('Cover generation error:', err);
      return undefined;
    }
  };

  const generateCovers = async (images: ReferenceImage[], prompt: string): Promise<GeneratedCover[]> => {
    return callCoverGenerator(images, prompt);
  };

  const generateBatch = async (params: BatchGenerationConfig): Promise<BatchGenerationResult | undefined> => {
    const { theme, content, styleId, images } = params;

    try {
      setLoading({ isGenerating: true });

      const response = await fetch('/api/cover-generator/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          content,
          styleId,
          images: images?.map(img => ({ base64: img.base64 })) || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '批量生成失败');
      }

      setState(prev => ({ ...prev, isGenerating: false }));
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量生成失败，请重试';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      console.error('Batch generation error:', err);
      return undefined;
    }
  };

  return { ...state, generate, generateBatch, reset };
}
