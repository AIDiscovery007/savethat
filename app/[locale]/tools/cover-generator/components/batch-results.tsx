'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegoButton } from '@/components/ui/lego-button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { DownloadIcon, TrashIcon } from '@phosphor-icons/react';
import type { BatchGenerationResult } from '../types';

interface BatchResultsProps {
  result: BatchGenerationResult;
  styleId: string;
  onClear: () => void;
}

export function BatchResults({ result, styleId, onClear }: BatchResultsProps) {
  const t = useTranslations('CoverGenerator');

  // 批量下载所有图片
  const handleDownloadAll = async () => {
    const allImages = [result.cover, ...result.contentPages];

    for (let i = 0; i < allImages.length; i++) {
      const image = allImages[i];
      const prefix = i === 0 ? 'cover' : `page-${i}`;
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `xiaohongshu-${prefix}-${Date.now()}.png`;
      link.click();

      // 添加延迟以避免下载被阻止
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // 下载单张图片
  const handleDownloadOne = (image: { url: string; id: string }) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `xiaohongshu-${image.id}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 分析结果说明 */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{t('batchAnalysisResult')}</span>
            <Badge variant="secondary">{result.totalImages} {t('batchImages')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{result.analysis.reasoning}</p>

            {/* 图片角色说明 */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium">{t('batchCover')}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.analysis.coverFocus}</p>
              </div>
              {result.analysis.contentPages.map((page) => (
                <div key={page.index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium">
                    {t('batchPage')} {page.index} - {page.layout}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{page.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 封面 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('batchCover')}</h3>
          <LegoButton
            color="white"
            size="sm"
            onClick={() => handleDownloadOne(result.cover)}
          >
            <DownloadIcon className="h-4 w-4 mr-1" />
            {t('download')}
          </LegoButton>
        </div>
        <div className="aspect-4/3 max-w-xs">
          <img
            src={result.cover.url}
            alt="Cover"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      </div>

      {/* 内容页 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('batchContentPages')}</h3>
          <LegoButton
            color="white"
            size="sm"
            onClick={handleDownloadAll}
          >
            <DownloadIcon className="h-4 w-4 mr-1" />
            {t('batchDownloadAll')}
          </LegoButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.contentPages.map((page, index) => (
            <div key={page.id} className="space-y-2">
              <div className="aspect-4/3 relative group">
                <img
                  src={page.url}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <LegoButton
                    size="sm"
                    onClick={() => handleDownloadOne(page)}
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </LegoButton>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t('batchPage')} {index + 1}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 清除按钮 */}
      <div className="flex justify-end">
        <LegoButton
          color="white"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          {t('clear')}
        </LegoButton>
      </div>
    </div>
  );
}
