/**
 * Image utility functions
 * Shared validation and parsing for base64 images
 */

// Image size limit (10MB)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate base64 image data
 */
export function validateBase64Image(base64: string): boolean {
  if (!base64 || base64.length === 0) return false;

  const dataUrlPattern = /^data:image\/(jpeg|png|webp|gif);base64,/;
  const isDataUrl = dataUrlPattern.test(base64);

  const cleanBase64 = isDataUrl ? base64.replace(dataUrlPattern, '') : base64;
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(cleanBase64)) return false;

  const estimatedBytes = (cleanBase64.length * 3) / 4;
  return estimatedBytes <= MAX_IMAGE_SIZE;
}

/**
 * Parse base64 image data
 */
export function parseBase64Image(base64: string): { mimeType: string; data: Buffer } {
  const dataUrlPattern = /^data:image\/(jpeg|png|webp|gif);base64,/;
  const match = base64.match(dataUrlPattern);

  if (match) {
    const mimeType = match[1];
    const data = Buffer.from(base64.replace(dataUrlPattern, ''), 'base64');
    return { mimeType: `image/${mimeType}`, data };
  } else {
    const data = Buffer.from(base64, 'base64');
    const mimeType = detectMimeType(data);
    return { mimeType, data };
  }
}

/**
 * Detect MIME type from image buffer
 */
export function detectMimeType(buffer: Buffer): string {
  if (buffer.length >= 4) {
    const header = buffer.subarray(0, 4).toString('hex');

    if (header.startsWith('ffd8ff')) return 'image/jpeg';
    if (header.startsWith('89504e47')) return 'image/png';
    if (header.startsWith('52494646') && buffer.length >= 12) {
      const webpHeader = buffer.subarray(8, 12).toString('ascii');
      if (webpHeader === 'WEBP') return 'image/webp';
    }
    if (header.startsWith('47494638')) return 'image/gif';
  }

  return 'image/jpeg';
}
