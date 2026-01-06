'use client';

/**
 * 封面卡片组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  DownloadIcon,
  CopyIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { GeneratedCover } from '../page';

interface CoverCardProps {
  cover: GeneratedCover;
  prompt: string;
  onRegenerate?: () => void;
}

export function CoverCard({ cover, prompt, onRegenerate }: CoverCardProps) {
  const t = useTranslations('CoverGenerator');
  const [copied, setCopied] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // 下载图片
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = cover.url;
    link.download = `cover-${Date.now()}.png`;
    link.click();
  };

  // 复制链接
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cover.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 复制提示词
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      // 可以添加 toast 提示
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  return (
    <Card className="rounded-[var(--radius)] overflow-hidden group">
      <CardContent className="p-0">
        {/* 图片预览 */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {imageError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">图片加载失败</p>
            </div>
          ) : (
            <img
              src={cover.url}
              alt="Generated cover"
              className="w-full h-full object-contain transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          )}

          {/* 悬浮操作栏 */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="gap-1"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                {t('download')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
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
        <div className="p-3 space-y-2">
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
  );
}
