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
Reference Images: ${imageCount} image(s) - these images provide color palette, mood, and style direction

Generate an ASCII layout structure that:
1. Uses 3:4 vertical ratio (Xiaohongshu standard: 1024x1366px or higher resolution)
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
- Maintain 3:4 Xiaohongshu vertical ratio (1024x1366px)
- Bold, readable title text that catches attention
- Clear visual hierarchy with dominant headline
- Strategic use of negative space
- Eye-catching data points or numbers highlighted
- Clean, modern aesthetic that works for Chinese social media`
    : `

## COMPOSITION RULES:
- Use vertical 3:4 aspect ratio (Xiaohongshu standard: 1024x1366px or higher)
- Bold, readable title text that catches attention
- Clear visual hierarchy with dominant headline
- Strategic use of negative space
- Eye-catching data points or numbers highlighted
- Clean, modern aesthetic that works for Chinese social media`;

  return `You are a professional Xiaohongshu (Chinese lifestyle platform) cover designer.
Your task is to analyze reference images and user requirements, then generate optimized prompts for Gemini image generation.

## CRITICAL REQUIREMENTS:
1. STRICTLY FOLLOW the user's original prompt - preserve all key elements, themes, and intent
2. ANALYZE reference images for style characteristics (colors, composition, layout, mood) and incorporate them
3. ENHANCE but DO NOT ALTER the user's core message - only add technical details for better image generation
4. Use English, be concise yet detailed enough for Gemini to understand
5. Include Xiaohongshu-specific keywords: high-quality texture, atmospheric, appealing to viewers
6. Output only the optimized English prompt, no explanations

## REFERENCE IMAGE ANALYSIS (MANDATORY):
You MUST extract and incorporate from the reference images:
- Color palette and tone (warm/cool, vibrant/muted)
- Lighting style (bright, soft, dramatic)
- Composition style (centered, rule of thirds, minimalist)
- Mood and atmosphere (energetic, calm, luxury, playful)
- Any specific visual elements that define the style

## USER PROMPT RESPECT (MANDATORY):
- The user's prompt is the SOURCE OF TRUTH - never contradict or ignore it
- Only add technical specifications (lighting, composition, quality) to enhance the user's vision
- If the user's prompt is brief, expand it with style-consistent details
- If the user's prompt is detailed, preserve all elements while optimizing for image generation

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
  const imageGuidance = imageCount > 0
    ? `## REFERENCE IMAGES ANALYSIS GUIDANCE:
The ${imageCount} reference image(s) you receive provide:
- Style direction: colors, lighting, mood, atmosphere
- Composition reference: layout, visual hierarchy, element placement
- Quality benchmark: texture quality, detail level, overall aesthetic

You MUST incorporate the visual characteristics from these reference images into your optimized prompt while keeping the user's core message intact.`
    : `## NO REFERENCE IMAGES:
No reference images provided - focus purely on the user's prompt and style configuration.`;

  return `## User Requirements (SOURCE OF TRUTH):
${userPrompt}

${imageGuidance}

## Style Details:
${styleConfig
  ? `Target Style: ${styleConfig.name}
Mood: ${styleConfig.mood}
Colors: ${styleConfig.colors.primary}, ${styleConfig.colors.secondary}, ${styleConfig.colors.accent}`
  : `Style ID: ${styleId}`}

## Layout Intent:
${layoutIntent ? `Layout Intent: ${layoutIntent} (detected from user prompt)` : 'Layout Intent: Auto-detect based on theme'}

## Task:
Generate an optimized English prompt for Xiaohongshu cover generation that:
1. STRICTLY PRESERVES all key elements from the user's original prompt
2. INCORPORATES style characteristics from reference images (colors, lighting, mood, composition)
3. FOLLOWS the detected or auto-selected layout structure
4. Creates an eye-catching, scroll-stopping design
5. Works well on mobile (3:4 vertical format: 1024x1366px)
6. Includes text/title elements that would grab attention
7. Maintains the reference image's aesthetic qualities
8. Adds Xiaohongshu-specific quality keywords: high-quality texture, atmospheric lighting, professional photography

## IMPORTANT:
- The user's prompt is the foundation - never remove or contradict user's intent
- Reference images are style references - adapt their aesthetic, don't copy content
- Output only the optimized prompt, no explanations`;
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
