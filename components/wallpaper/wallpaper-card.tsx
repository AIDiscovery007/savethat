'use client';

import * as React from 'react';
import { Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WallhavenWallpaper } from '@/lib/api/wallhaven/types';

interface WallpaperCardProps {
  wallpaper: WallhavenWallpaper;
  index: number;
  onDownload?: (wallpaper: WallhavenWallpaper) => void;
  className?: string;
}

export function WallpaperCard({
  wallpaper,
  index,
  onDownload,
  className,
}: WallpaperCardProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // 下载壁纸
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(wallpaper);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 纯度徽章颜色
  const purityColor = {
    sfw: 'bg-green-500/20 text-green-700 dark:text-green-400',
    sketchy: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    nsfw: 'bg-red-500/20 text-red-700 dark:text-red-400',
  };

  return (
    <>
      {/* 预览弹窗 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl p-0 bg-transparent border-0 shadow-none overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Wallpaper Preview</DialogTitle>
          </DialogHeader>
          {!imageError && (
            <div className="relative">
              <img
                src={wallpaper.file?.url || wallpaper.thumbs.small}
                alt={wallpaper.id}
                className="w-full h-auto max-h-[85vh] object-contain"
                onError={() => setImageError(true)}
              />
              {/* 预览页底部操作栏 */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card
        className={cn(
          'rounded-xl overflow-hidden group cursor-pointer transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/10',
          'border border-transparent',
          className
        )}
        onClick={() => setShowPreview(true)}
      >
        <CardContent className="p-0">
          {/* 图片区域 */}
          <div className="relative aspect-[9/16] bg-muted overflow-hidden">
            {/* 加载骨架 */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}

            {/* 图片 */}
            {!imageError && (
              <img
                src={wallpaper.thumbs.large}
                alt={wallpaper.id}
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  'group-hover:scale-110',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}

            {/* 加载失败 */}
            {imageError && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Failed to load</p>
              </div>
            )}

            {/* 纯度徽章 */}
            <div className="absolute top-2 right-2 z-10">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs px-2 py-0.5',
                  purityColor[wallpaper.purity]
                )}
              >
                {wallpaper.purity.toUpperCase()}
              </Badge>
            </div>

            {/* 悬浮操作栏 */}
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10',
                'transition-all duration-200',
                'opacity-0 group-hover:opacity-100',
                'translate-y-2 group-hover:translate-y-0'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{wallpaper.resolution}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {wallpaper.favorites}
                </span>
                <span>{formatFileSize(wallpaper.file_size)}</span>
              </div>
            </div>
            {wallpaper.category && (
              <Badge variant="outline" className="text-xs">
                {wallpaper.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
