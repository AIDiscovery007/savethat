'use client';

/**
 * 封面卡片组件
 * 创意趣味风格设计
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  DownloadIcon,
  ArrowClockwiseIcon,
  TrashIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LegoButton } from '@/components/ui/lego-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { GeneratedCover } from '../types';
import { cn } from '@/lib/utils';

interface CoverCardProps {
  cover: GeneratedCover;
  prompt: string;
  onDelete?: (coverId: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

export function CoverCard({ cover, prompt, onDelete, onRegenerate, className }: CoverCardProps) {
  const t = useTranslations('CoverGenerator');
  const [imageError, setImageError] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  // 下载图片
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = cover.url;
    link.download = `cover-${Date.now()}.png`;
    link.click();
  };

  return (
    <>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0 shadow-none overflow-hidden">
          {/* 无障碍标题（视觉隐藏） */}
          <DialogHeader className="sr-only">
            <DialogTitle>封面图片预览</DialogTitle>
          </DialogHeader>
          {!imageError && (
            <img
              src={cover.url}
              alt="Generated cover preview"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Card
        className={cn(
          'rounded-xl overflow-hidden group',
          'transition-all duration-300 ease-out',
          'hover:shadow-xl hover:shadow-primary/10',
          'border border-transparent group-hover:border-primary/20',
          'bg-background cursor-pointer',
          className
        )}
        onClick={() => !imageError && setShowPreview(true)}
      >
        <CardContent className="p-0">
          {/* 图片预览区域 */}
          <div className={cn(
            "relative aspect-[3/2] bg-muted overflow-hidden",
            "transition-transform duration-300 ease-out",
            "group-hover:scale-[1.02]"
          )}>
            {imageError ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">图片加载失败</p>
              </div>
            ) : (
              <>
                <img
                  src={cover.url}
                  alt="Generated cover"
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />

                {/* 悬浮按钮组 - 顶部 */}
                <div
                  className={cn(
                    "absolute top-2 left-2 right-2 flex justify-end z-20",
                    "transition-all duration-200 ease-out",
                    "opacity-0 group-hover:opacity-100",
                    "translate-y-[-8px] group-hover:translate-y-0"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 删除按钮 - 带确认弹窗 */}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 rounded-full shadow-lg"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteImageDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(cover.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            )}

            {/* 悬浮操作栏 - 底部 */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20",
                "transition-all duration-200 ease-out",
                "opacity-0 group-hover:opacity-100",
                "translate-y-[8px] group-hover:translate-y-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2">
                <LegoButton
                  color="white"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  {t('download')}
                </LegoButton>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* 提示词预览 + 查看提示词按钮 */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                {prompt}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    title={t('viewPrompt')}
                  >
                    <FileTextIcon className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('viewPrompt')}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
                      {prompt}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 重新生成按钮 */}
            {onRegenerate && (
              <LegoButton
                color="yellow"
                size="sm"
                onClick={onRegenerate}
                className="w-full gap-1"
              >
                <ArrowClockwiseIcon className="h-3.5 w-3.5" />
                {t('regenerate')}
              </LegoButton>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
