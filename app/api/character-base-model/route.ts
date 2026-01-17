/**
 * Character Base Model API Route
 * Analyzes reference images and generates T-pose character base models
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel, isConfigured } from '@/lib/api/aihubmix/sdk-client';
import { validateBase64Image, parseBase64Image } from '@/lib/utils/image';
import {
  buildGenerationPrompt,
  parseCharacterAnalysis,
  formatCharacterForPrompt,
} from '@/lib/api/aihubmix/prompts/character-base-model';

// Analysis prompt - kept inline to avoid import issues
const ANALYSIS_PROMPT = `You are an expert forensic sketch artist. Analyze this character image with extreme precision.

## CRITICAL INSTRUCTIONS
- You MUST describe every visual detail that can be observed
- Think like a witness describing a suspect to a sketch artist
- Be specific, not vague. "Brown hair" is bad. "Straight medium-length brown hair with slight wave, parted in the middle" is good.
- Note exact colors, shapes, proportions, and spatial relationships

## Detailed Analysis Required

### 1. HAIR (Be extremely specific)
- Length: exact measurement if possible
- Style: straight/wavy/curly/coiled
- Color: exact shade (auburn, chestnut, jet black, platinum blonde)
- Texture: silky/frizzy/thick/thin
- Parting: center/part/none/side (which side?)
- Bangs/fringe: yes/no, if yes how styled
- Unique features: highlights, braids, ponytail, bun, shaved patterns, etc.

### 2. FACE (Critical for recognition)
- Face shape: oval/round/square/heart/diamond/oblong
- Eye shape: almond/round/hooded/deep-set/wide-set
- Eye color: exact shade
- Eye size: large/medium/small relative to face
- Eyebrows: thick/thin/arched/straight/color
- Nose: button/straight/hook/bulbous/narrow
- Lips: thin/full/prominent philtrum/cupid's bow
- Any scars, marks, wrinkles, or unique marks?

### 3. SKIN & BODY
- Skin tone: exact shade range
- Visible tattoos or birthmarks? Location!
- Any visible jewelry? (earrings, piercings - exact locations)

### 4. CLOTHING (This is critical - describe EVERY item visible)
For EACH layer of clothing:
- Exact color
- Material hints (leather, cotton, denim, silk)
- Fit (tight/loose/oversized)
- Length and coverage
- Visible details: buttons, zippers, pockets, collars, cuffs, hood, V-neck, etc.
- Graphics, logos, text, patterns?

### 5. BODY PROPORTIONS
- Approximate head-to-body ratio
- Shoulder width relative to hips
- Arm length relative to body
- Leg length relative to body

### 6. OVERALL STYLE & VIBE
- Age apparent
- Fashion style: goth/hipster/athletic/casual/formal/alternative
- Any distinctive accessories

Output as detailed JSON - every field matters for reconstruction accuracy.`;

// API configuration
export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes timeout for two-step process
export const dynamic = 'force-dynamic';

// Error type mapping
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string; status: number }> = [
  { pattern: /API key|authentication/i, message: 'Authentication failed. Please check your API key.', status: 401 },
  { pattern: /rate limit|quota/i, message: 'Rate limit exceeded. Please try again later.', status: 429 },
  { pattern: /timeout|deadline/i, message: 'Generation timed out. Please try again.', status: 504 },
  { pattern: /model.*not found|unsupported.*model/i, message: 'Model not available. Please try again later.', status: 400 },
];

/**
 * Handle API errors and return standardized response
 */
function handleApiError(error: Error): NextResponse {
  const errorMessage = error.message;

  for (const { pattern, message, status } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return NextResponse.json({ error: message }, { status });
    }
  }

  return NextResponse.json(
    { error: errorMessage || 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check API configuration
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'API key not configured. Please set AIHUBMIX_API_KEY environment variable.' },
        { status: 401 }
      );
    }

    // Parse request body
    const { image } = await request.json();

    // Validate image
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Please upload a reference image.' },
        { status: 400 }
      );
    }

    if (!validateBase64Image(image)) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Parse image
    const { mimeType, data } = parseBase64Image(image);

    // Step 1: Analyze character features (gemini-3-flash-preview-search supports thinking by default)
    const analysisResult = await generateText({
      model: getModel('gemini-3-pro-preview'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: data, mediaType: mimeType },
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
      maxOutputTokens: 65536,
      temperature: 0.3,
    });

    // Parse character description from analysis
    const characterDesc = parseCharacterAnalysis(analysisResult.text);

    // Step 2: Generate T-pose base model (image + prompt)
    const finalPrompt = buildGenerationPrompt(formatCharacterForPrompt(characterDesc));

    // Step 2: Generate T-pose base model (image + prompt)
    // Use gemini-3-pro-image-preview with image input support
    const generationResult = await generateText({
      model: getModel('gemini-3-pro-image-preview'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: data, mediaType: mimeType },
            { type: 'text', text: finalPrompt },
          ],
        },
      ],
      maxOutputTokens: 65536,
      temperature: 0.3,
    });

    // Extract generated image
    const generatedFile = generationResult.files?.[0];
    if (!generatedFile || !generatedFile.mediaType?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Failed to generate T-pose base model. Please try again.' },
        { status: 500 }
      );
    }

    const base64 = Buffer.from(generatedFile.uint8Array).toString('base64');
    const imageUrl = `data:${generatedFile.mediaType};base64,${base64}`;

    return NextResponse.json({
      image: imageUrl,
      analysis: characterDesc,
    });
  } catch (error) {
    console.error('Character base model generation error:', error);

    if (error instanceof Error) {
      return handleApiError(error);
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
