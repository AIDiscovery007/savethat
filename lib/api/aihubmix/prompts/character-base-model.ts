/**
 * Character Base Model Prompts
 * Prompts for character analysis and T-pose base model generation
 */

/**
 * Generation prompt - 100% faithful reproduction in original art style
 */
export const GENERATION_PROMPT = `You are creating a T-pose version of the character in the reference image.

## ABSOLUTE REQUIREMENTS (Non-Negotiable)

### 1. Complete Art Style Reproduction (CRITICAL)
- Copy the EXACT drawing style, line work, and shading technique
- Keep the same line weight, stroke style, and artistic approach
- Maintain the same level of detail and rendering
- Copy any unique art characteristics (brush strokes, textures, etc.)

### 2. Faithful Character Reproduction (CRITICAL)
- The character MUST look IDENTICAL to the reference image
- Copy facial features, expressions, likeness exactly
- Copy hair color, style, and details exactly
- Copy clothing colors, patterns, and styles exactly
- Copy body proportions and build exactly
- Copy accessories and props exactly

### 3. Only Change the Pose
- Transform the character to standard T-pose:
  - Arms extended 90 degrees from body, palms facing forward
  - Legs shoulder-width apart, feet pointing forward
  - Head facing forward, neutral expression
  - Shoulders relaxed and open

## YOUR TASK
1. Study the reference image carefully - note every artistic detail
2. Create the SAME character in T-pose
3. The art style must be indistinguishable from the original
4. Only the pose changes - nothing else

## OUTPUT
A T-pose version of this character that looks like it could be the same character in a different pose from the original artwork.`;

/**
 * Build generation prompt - 100% faithful reproduction
 */
export function buildGenerationPrompt(characterDescription: string, style: string = 'line-art'): string {
  return `You are creating a T-pose version of the character in the reference image.

## Reference Image Analysis:
${characterDescription}

## ABSOLUTE REQUIREMENTS

### Art Style (MUST match original)
- Keep the EXACT same art style, line work, and shading
- Maintain the same drawing technique and artistic approach
- Copy any unique art characteristics exactly

### Character (MUST match original)
- Create an IDENTICAL character to the reference
- Copy every visual detail: face, hair, clothing, accessories
- Keep the same proportions, colors, and style

### Only Pose Changes
- Transform to standard T-pose:
  - Arms 90 degrees from body, palms forward
  - Legs shoulder-width apart, feet forward
  - Head forward, neutral expression

## OUTPUT
A T-pose version of this character that looks exactly like the original artwork, just in T-pose.`;
}

/**
 * Character description interface
 */
export interface CharacterDescription {
  gender: string;
  ageRange: string;
  build: string;
  hair: string;
  face: string;
  skinTone: string;
  accessories: string;
  heightRatio: string;
  shoulderWidth: string;
  proportions: string;
  upperBody: string;
  lowerBody: string;
  footwear: string;
  clothingAccessories: string;
  overallStyle: string;
  colorPalette: string;
  uniqueFeatures: string;
}

/**
 * Parse character analysis result from model output
 */
export function parseCharacterAnalysis(analysisText: string): CharacterDescription {
  // Try to extract JSON if present
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        gender: parsed.gender || 'Unknown',
        ageRange: parsed.ageRange || 'Adult',
        build: parsed.build || 'Average',
        hair: parsed.hair || 'Unknown',
        face: parsed.face || 'Unknown',
        skinTone: parsed.skinTone || 'Unknown',
        accessories: parsed.accessories || 'None',
        heightRatio: parsed.heightRatio || 'Normal',
        shoulderWidth: parsed.shoulderWidth || 'Average',
        proportions: parsed.proportions || 'Normal',
        upperBody: parsed.upperBody || 'Unknown',
        lowerBody: parsed.lowerBody || 'Unknown',
        footwear: parsed.footwear || 'Unknown',
        clothingAccessories: parsed.clothingAccessories || 'None',
        overallStyle: parsed.overallStyle || 'Realistic',
        colorPalette: parsed.colorPalette || 'Unknown',
        uniqueFeatures: parsed.uniqueFeatures || 'None',
      };
    } catch {
      // Fall through to text parsing
    }
  }

  // Fallback: create description from raw text
  return {
    gender: extractField(analysisText, /gender[:\s]+([^\n]+)/i) || 'Unknown',
    ageRange: extractField(analysisText, /age[:\s]+([^\n]+)/i) || 'Adult',
    build: extractField(analysisText, /build[:\s]+([^\n]+)/i) || 'Average',
    hair: extractField(analysisText, /hair[:\s]+([^\n]+)/i) || 'Unknown',
    face: extractField(analysisText, /face[:\s]+([^\n]+)/i) || 'Unknown',
    skinTone: extractField(analysisText, /skin[:\s]+([^\n]+)/i) || 'Unknown',
    accessories: extractField(analysisText, /accessories[:\s]+([^\n]+)/i) || 'None',
    heightRatio: extractField(analysisText, /height[:\s]+([^\n]+)/i) || 'Normal',
    shoulderWidth: extractField(analysisText, /shoulder[:\s]+([^\n]+)/i) || 'Average',
    proportions: extractField(analysisText, /proportion[:\s]+([^\n]+)/i) || 'Normal',
    upperBody: extractField(analysisText, /upper[:\s]+([^\n]+)/i) || 'Unknown',
    lowerBody: extractField(analysisText, /lower[:\s]+([^\n]+)/i) || 'Unknown',
    footwear: extractField(analysisText, /footwear[:\s]+([^\n]+)/i) || 'Unknown',
    clothingAccessories: extractField(analysisText, /clothing[:\s]+([^\n]+)/i) || 'None',
    overallStyle: extractField(analysisText, /style[:\s]+([^\n]+)/i) || 'Realistic',
    colorPalette: extractField(analysisText, /color[:\s]+([^\n]+)/i) || 'Unknown',
    uniqueFeatures: extractField(analysisText, /unique[:\s]+([^\n]+)/i) || 'None',
  };
}

/**
 * Helper function to extract field from text using regex
 */
function extractField(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * Format character description for prompt insertion
 */
export function formatCharacterForPrompt(desc: CharacterDescription): string {
  return `
Gender: ${desc.gender}
Age: ${desc.ageRange}
Build: ${desc.build}
Hair: ${desc.hair}
Face: ${desc.face}
Skin Tone: ${desc.skinTone}
Accessories: ${desc.accessories}
Height Ratio: ${desc.heightRatio}
Body Proportions: ${desc.proportions}
Upper Body: ${desc.upperBody}
Lower Body: ${desc.lowerBody}
Footwear: ${desc.footwear}
Additional Accessories: ${desc.clothingAccessories}
Style: ${desc.overallStyle}
Color Palette: ${desc.colorPalette}
Unique Features: ${desc.uniqueFeatures}
`.trim();
}
