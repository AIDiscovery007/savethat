import { NextRequest, NextResponse } from 'next/server';
import { wallhavenClient } from '@/lib/api/wallhaven/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 添加超时配置，大文件需要更长时间
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 获取壁纸信息和原图 URL
    const wallpaper = await wallhavenClient.getWallpaper(id);
    const fileUrl = await wallhavenClient.getDownloadUrl(id);

    // 获取文件扩展名
    const ext = wallpaper.file_type.split('/')[1] ?? 'jpg';
    const filename = `wallhaven-${id}.${ext}`;

    // 代理下载请求，添加 Content-Disposition 头强制下载
    const response = await fetch(fileUrl, {
      headers: {
        'Referer': 'https://wallhaven.cc/',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // 获取原始响应体
    const body = response.body;

    if (!body) {
      throw new Error('Empty response body');
    }

    // 返回流式响应，设置下载头
    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': wallpaper.file_type,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': response.headers.get('Content-Length') ?? '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Wallhaven Download API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to download wallpaper' },
      { status: 500 }
    );
  }
}
