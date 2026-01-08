'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WallpaperCard } from './wallpaper-card';
import { BlurFade } from '@/components/ui/blur-fade';
import { Empty } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import type { WallhavenWallpaper } from '@/lib/api/wallhaven/types';

interface WallpaperGridProps {
  wallpapers: WallhavenWallpaper[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDownload: (wallpaper: WallhavenWallpaper) => void;
  className?: string;
}

export function WallpaperGrid({
  wallpapers,
  loading,
  page,
  totalPages,
  onPageChange,
  onDownload,
  className,
}: WallpaperGridProps) {
  // 生成分页按钮
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const leftBound = Math.max(1, page - 2);
      const rightBound = Math.min(totalPages, page + 2);

      if (leftBound > 1) pages.push(1);
      if (leftBound > 2) pages.push('ellipsis');

      for (let i = leftBound; i <= rightBound; i++) pages.push(i);

      if (rightBound < totalPages - 1) pages.push('ellipsis');
      if (rightBound < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  // 加载骨架
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[9/16] rounded-xl" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // 空状态
  if (wallpapers.length === 0) {
    return (
      <Empty
        title="No wallpapers found"
        description="Try adjusting your search or filters"
        className="py-12"
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 壁纸网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wallpapers.map((wallpaper, index) => (
          <BlurFade key={wallpaper.id} delay={0.05 + index * 0.02}>
            <WallpaperCard
              wallpaper={wallpaper}
              index={index}
              onDownload={onDownload}
            />
          </BlurFade>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className="min-w-[40px]"
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
