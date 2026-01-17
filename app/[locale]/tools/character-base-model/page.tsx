'use client';

/**
 * Character Base Model Generator Page
 * Generates T-pose character base models from reference images
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PromptInput, type ReferenceImage } from '@/components/prompt-input';
import { LoadingPlaceholder } from '@/components/loading-placeholder';
import { CopyButton } from '@/components/copy-button';
import { ErrorDisplay } from '@/components/error-display';
import { ImageIcon, DownloadIcon, SparkleIcon } from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';

interface GenerationResult {
  image: string;
}

export default function CharacterBaseModelPage() {
  const t = useTranslations('CharacterBaseModel');

  // State
  const [referenceImage, setReferenceImage] = React.useState<ReferenceImage | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Initialize
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle image upload
  const handleImagesChange = (images: ReferenceImage[]) => {
    setReferenceImage(images[0] || null);
    setResult(null);
    setError(null);
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!referenceImage?.base64) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/character-base-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: referenceImage.base64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult({
        image: data.image,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!result?.image) return;

    const link = document.createElement('a');
    link.href = result.image;
    link.download = `character-base-model-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if can generate
  const canGenerate = !!referenceImage?.base64;

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Card */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('uploadTitle')}</CardTitle>
              <CardDescription>{t('uploadDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PromptInput
                value=""
                onChange={() => {}}
                placeholder={t('uploadPlaceholder')}
                disabled={isGenerating}
                images={referenceImage ? [referenceImage] : []}
                onImagesChange={handleImagesChange}
                maxImages={1}
                showCount={false}
                submitOnCtrlEnter={false}
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full rounded-xl"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <SparkleIcon className="mr-2 h-4 w-4" />
                {t('generate')}
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && <ErrorDisplay error={error} />}
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-2 space-y-6">
          {isGenerating ? (
            <LoadingPlaceholder
              message={t('generatingMessage')}
              icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
            />
          ) : result ? (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('resultTitle')}</CardTitle>
                  <div className="flex items-center gap-2">
                    <CopyButton value={result.image} variant="ghost" size="icon-xs" />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleDownload}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
                  <img
                    src={result.image}
                    alt={t('resultAlt')}
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl">
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
