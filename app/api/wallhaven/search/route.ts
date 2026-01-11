import { NextRequest, NextResponse } from 'next/server';
import { wallhavenClient } from '@/lib/api/wallhaven/client';
import type { WallhavenSearchParams } from '@/lib/api/wallhaven/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 构建搜索参数
  const params: WallhavenSearchParams = {
    q: searchParams.get('q') || undefined,
    categories: searchParams.get('categories') || '110',
    purity: searchParams.get('purity') || '100',
    sorting: (searchParams.get('sorting') as WallhavenSearchParams['sorting']) || 'date_added',
    order: (searchParams.get('order') as 'desc' | 'asc') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    // limit 最大 24
    limit: Math.min(parseInt(searchParams.get('limit') || '24', 10), 24),
  };

  console.log('[Wallhaven Search] Params:', params);

  try {
    const response = await wallhavenClient.search(params);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Wallhaven Search API] Error:', error);

    if (error instanceof Error && error.name === 'WallhavenAPIError') {
      const statusCode = (error as Error & { statusCode: number }).statusCode || 500;
      console.error('[Wallhaven Search] API Error:', error.message, 'Status:', statusCode);
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search wallpapers' },
      { status: 500 }
    );
  }
}
