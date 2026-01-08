import { NextRequest, NextResponse } from 'next/server';
import { wallhavenClient } from '@/lib/api/wallhaven/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const wallpaper = await wallhavenClient.getWallpaper(id);
    const fileUrl = await wallhavenClient.getDownloadUrl(id);

    return NextResponse.json({
      id: wallpaper.id,
      file_url: fileUrl,
      file_type: wallpaper.file_type,
      resolution: wallpaper.resolution,
    });
  } catch (error) {
    console.error('[Wallhaven Wallpaper API] Error:', error);

    if (error instanceof Error && error.name === 'WallhavenAPIError') {
      return NextResponse.json(
        { error: error.message },
        { status: (error as Error & { statusCode: number }).statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get wallpaper info' },
      { status: 500 }
    );
  }
}
