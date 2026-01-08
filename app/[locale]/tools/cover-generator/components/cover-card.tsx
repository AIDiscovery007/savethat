'use client';

/**
 * 封面卡片组件
 * 创意趣味风格设计
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  DownloadIcon,
  CopyIcon,
  ArrowClockwiseIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [copied, setCopied] = React.useState(false);
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

  // 复制链接
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(cover.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 复制提示词
  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
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
            "relative aspect-[4/3] bg-muted overflow-hidden",
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  {t('download')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      {t('copy')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* 提示词预览 */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                {prompt}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleCopyPrompt}
                title={t('copyPrompt')}
              >
                <CopyIcon className="h-3 w-3" />
              </Button>
            </div>

            {/* 重新生成按钮 */}
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="w-full gap-1"
              >
                <ArrowClockwiseIcon className="h-3.5 w-3.5" />
                {t('regenerate')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
