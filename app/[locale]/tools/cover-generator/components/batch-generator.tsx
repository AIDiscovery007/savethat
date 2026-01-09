'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegoButton } from '@/components/ui/lego-button';
import { StyleOptions } from './style-options';
import { PromptInput, type ReferenceImage } from '@/components/prompt-input';
import { Loader2 } from 'lucide-react';
import type { BatchGenerationResult } from '../types';

interface BatchGeneratorProps {
  selectedStyleId: string;
  onStyleChange: (id: string) => void;
  onComplete: (result: BatchGenerationResult) => void;
  disabled?: boolean;
}

export function BatchGenerator({
  selectedStyleId,
  onStyleChange,
  onComplete,
  disabled,
}: BatchGeneratorProps) {
  const t = useTranslations('CoverGenerator');

  const [theme, setTheme] = React.useState('');
  const [content, setContent] = React.useState('');
  const [images, setImages] = React.useState<ReferenceImage[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 处理批量生成
  const handleGenerate = async () => {
    if (!theme.trim() || !content.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/cover-generator/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          content,
          styleId: selectedStyleId,
          images: images.map((img) => ({ base64: img.base64 })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '批量生成失败');
      }

      const result = await response.json();
      onComplete(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量生成失败，请重试';
      setError(errorMessage);
      console.error('Batch generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 判断是否可以生成
  const canGenerate = theme.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 配置面板 - 全宽 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 风格选择 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('styleSelect')}</CardTitle>
          </CardHeader>
          <CardContent>
            <StyleOptions
              selectedStyleId={selectedStyleId}
              onStyleChange={onStyleChange}
              disabled={disabled || isGenerating}
            />
          </CardContent>
        </Card>

        {/* 笔记主题 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('batchThemeTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptInput
              value={theme}
              onChange={setTheme}
              disabled={disabled || isGenerating}
              placeholder={t('batchThemePlaceholder')}
              maxLength={200}
              rows={2}
              autoResize={false}
            />
          </CardContent>
        </Card>

        {/* 笔记内容 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('batchContentTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptInput
              value={content}
              onChange={setContent}
              disabled={disabled || isGenerating}
              placeholder={t('batchContentPlaceholder')}
              maxLength={5000}
              rows={6}
              autoResize={false}
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <LegoButton
          onClick={handleGenerate}
          disabled={!canGenerate || disabled || isGenerating}
          className="rounded-xl"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('batchGenerating')}
            </>
          ) : (
            t('batchGenerate')
          )}
        </LegoButton>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="rounded-xl border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
