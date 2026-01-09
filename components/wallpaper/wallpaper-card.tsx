'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, BookmarkPlus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegoButton } from '@/components/ui/lego-button';
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
import { CollectionSelectDialog } from './collection-select-dialog';
import { useWallpaperFavorites } from '@/lib/hooks/use-wallpaper-favorites';

interface WallpaperCardProps {
  wallpaper: WallhavenWallpaper;
  index: number;
  onDownload?: (wallpaper: WallhavenWallpaper) => void;
  onRemove?: (wallpaper: WallhavenWallpaper) => void;
  className?: string;
}

export function WallpaperCard({
  wallpaper,
  index,
  onDownload,
  onRemove,
  className,
}: WallpaperCardProps) {
  const {
    collections,
    isInCollection,
    addToCollection,
  } = useWallpaperFavorites();

  const [showPreview, setShowPreview] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [checkingFavorite, setCheckingFavorite] = React.useState(true);
  const [favoriteCollectionIds, setFavoriteCollectionIds] = React.useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  // 检查壁纸是否在任何收藏夹中
  React.useEffect(() => {
    const checkFavoriteStatus = async () => {
      setCheckingFavorite(true);
      const ids = new Set<string>();
      for (const collection of collections) {
        const result = await isInCollection(collection.id, wallpaper.id);
        if (result) {
          ids.add(collection.id);
        }
      }
      setFavoriteCollectionIds(ids);
      setIsFavorited(ids.size > 0);
      setCheckingFavorite(false);
    };
    checkFavoriteStatus();
  }, [collections, wallpaper.id, isInCollection]);

  // 键盘导航支持
  React.useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPreview(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreview]);

  // 下载壁纸
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await onDownload?.(wallpaper);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  // 打开收藏夹选择
  const handleOpenCollection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCollectionDialog(true);
  };

  // 移除壁纸
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(wallpaper);
  };

  // 添加到收藏夹
  const handleAddToCollection = async (collectionId: string) => {
    await addToCollection(collectionId, wallpaper);
    setShowCollectionDialog(false);
    setIsFavorited(true);
    // 显示成功动画
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 1500);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 纯度徽章颜色 - 使用语义化变量
  const purityColor = {
    sfw: 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    sketchy: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    nsfw: 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              {/* 预览页底部操作栏 */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center justify-center gap-3">
                  <LegoButton
                    color="white"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"
                        />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </LegoButton>
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
                <LegoButton
                  color="white"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="gap-1.5"
                >
                  {isDownloading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-3.5 w-3.5 border-2 border-gray-500 border-t-transparent rounded-full"
                    />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloading ? '...' : 'Download'}
                </LegoButton>
                {onRemove ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : (
                  <div className="relative">
                    {showSaveSuccess && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
                      >
                        Saved!
                      </motion.div>
                    )}
                    <LegoButton
                      color={isFavorited ? 'yellow' : 'white'}
                      size="sm"
                      onClick={handleOpenCollection}
                      className={cn(
                        'gap-1.5',
                        isFavorited && 'bg-red-500 text-white'
                      )}
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      {isFavorited ? 'Saved' : 'Save'}
                    </LegoButton>
                  </div>
                )}
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

      {/* 收藏夹选择弹窗 */}
      <CollectionSelectDialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
        collections={collections}
        wallpaper={wallpaper}
        currentCollectionId={undefined}
        favoriteCollectionIds={favoriteCollectionIds}
        onSelectCollection={handleAddToCollection}
        onCreateCollection={async (name) => {
          const { wallpaperStorage } = await import('@/lib/storage/wallpaper-storage');
          const collection = await wallpaperStorage.createCollection(name);
          await addToCollection(collection.id, wallpaper);
          setShowCollectionDialog(false);
          setIsFavorited(true);
        }}
      />
    </>
  );
}
