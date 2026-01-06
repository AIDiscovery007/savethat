'use client';

/**
 * 小红书封面生成器主页面
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReferenceUploader } from './components/reference-uploader';
import { PromptInput } from './components/prompt-input';
import { StyleOptions } from './components/style-options';
import { GenerationPreview } from './components/generation-preview';
import { CoverCard } from './components/cover-card';
import { useCoverGeneration } from '@/lib/hooks/use-cover-generation';
import { Spinner, ImageIcon } from '@phosphor-icons/react';

export type CoverStyle = 'vibrant' | 'minimal' | 'warm' | 'cool' | 'playful';

export interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

export interface GeneratedCover {
  id: string;
  url: string;
  prompt: string;
}

export default function CoverGeneratorPage() {
  const t = useTranslations('CoverGenerator');

  // 状态管理
  const [referenceImages, setReferenceImages] = React.useState<ReferenceImage[]>([]);
  const [userPrompt, setUserPrompt] = React.useState('');
  const [selectedStyle, setSelectedStyle] = React.useState<CoverStyle>('vibrant');
  const [generatedCovers, setGeneratedCovers] = React.useState<GeneratedCover[]>([]);

  // Hook
  const {
    isOptimizing,
    isGenerating,
    optimizedPrompt,
    error,
    generate,
    reset,
  } = useCoverGeneration();

  // 处理参考图上传
  const handleImagesChange = (images: ReferenceImage[]) => {
    setReferenceImages(images);
  };

  // 处理生成
  const handleGenerate = async () => {
    if (!userPrompt.trim() || referenceImages.length === 0) return;

    const result = await generate({
      images: referenceImages,
      prompt: userPrompt,
      style: selectedStyle,
    });

    if (result?.covers) {
      setGeneratedCovers(result.covers);
    }
  };

  // 处理重置
  const handleReset = () => {
    setReferenceImages([]);
    setUserPrompt('');
    setGeneratedCovers([]);
    reset();
  };

  // 判断是否可以生成
  const canGenerate = referenceImages.length > 0 && userPrompt.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Badge variant="outline">{t('badge')}</Badge>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：配置面板 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 参考图上传 */}
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t('referenceImages')}
              </CardTitle>
              <CardDescription>{t('referenceImagesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceUploader
                images={referenceImages}
                onChange={handleImagesChange}
                maxImages={5}
                disabled={isGenerating || isOptimizing}
              />
            </CardContent>
          </Card>

          {/* 风格选择 */}
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('styleSelect')}</CardTitle>
              <CardDescription>{t('styleSelectDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StyleOptions
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                disabled={isGenerating || isOptimizing}
              />
            </CardContent>
          </Card>

          {/* 提示词输入 */}
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('promptTitle')}</CardTitle>
              <CardDescription>{t('promptDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PromptInput
                value={userPrompt}
                onChange={setUserPrompt}
                disabled={isGenerating || isOptimizing}
                placeholder={t('promptPlaceholder')}
              />
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating || isOptimizing}
              className="flex-1 rounded-[var(--radius)]"
            >
              {isGenerating || isOptimizing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  {isOptimizing ? t('optimizing') : t('generating')}
                </>
              ) : (
                t('generate')
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={referenceImages.length === 0 && userPrompt.trim() === '' && generatedCovers.length === 0}
              className="rounded-[var(--radius)]"
            >
              {t('reset')}
            </Button>
          </div>

          {/* 错误提示 */}
          {error && (
            <Card className="rounded-[var(--radius)] border-destructive">
              <CardContent className="pt-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：预览区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 优化后的提示词 */}
          {optimizedPrompt && (
            <Card className="rounded-[var(--radius)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="secondary">{t('optimized')}</Badge>
                  {t('optimizedPrompt')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {optimizedPrompt}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 生成结果 */}
          {generatedCovers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('generatedCovers')}</h3>
                <Badge variant="outline">{t('count', { count: generatedCovers.length })}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedCovers.map((cover) => (
                  <CoverCard
                    key={cover.id}
                    cover={cover}
                    prompt={optimizedPrompt || userPrompt}
                  />
                ))}
              </div>
            </div>
          ) : isGenerating ? (
            <GenerationPreview isGenerating />
          ) : (
            // 空状态
            <Card className="rounded-[var(--radius)]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {t('emptyState.title')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70 max-w-xs">
                  {t('emptyState.desc')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
