'use client';

/**
 * 小红书封面生成器主页面
 * 创意趣味风格设计
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ReferenceUploader } from './components/reference-uploader';
import { PromptInput } from '@/components/prompt-input';
import { StyleOptions } from './components/style-options';
import { CoversGrid } from './components/covers-grid';
import { useCoverGeneration } from '@/lib/hooks/use-cover-generation';
import { COVER_STYLES } from './config/styles';
import type { ReferenceImage, GeneratedCover } from './types';
import { ImageIcon, TrashIcon } from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// 单次生成记录
interface GenerationRecord {
  id: string;
  timestamp: number;
  prompt: string;
  optimizedPrompt: string;
  styleId: string;
  covers: GeneratedCover[];
}

/**
 * SessionStorage 工具对象（使用 sessionStorage 替代 localStorage，容量更大）
 * 图片 base64 数据较大，localStorage 5MB 限制容易溢出
 */
const storage = {
  load<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  },
  save<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  },
  clear(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// 从 sessionStorage 恢复历史记录
const loadHistory = (): GenerationRecord[] => {
  return storage.load<GenerationRecord[]>('cover-generator-history', []);
};

// 保存历史记录到 sessionStorage
const saveHistory = (history: GenerationRecord[]): void => {
  const serialized = JSON.stringify(history);
  // 检查存储是否接近满（单条记录超过 5MB 时触发清理）
  if (serialized.length > 5 * 1024 * 1024) {
    storage.save('cover-generator-history', history.slice(0, -2));
  } else {
    storage.save('cover-generator-history', history);
  }
};

// 最大保存记录数
const MAX_HISTORY_SIZE = 10;

export default function CoverGeneratorPage() {
  const t = useTranslations('CoverGenerator');

  // 状态管理
  const [referenceImages, setReferenceImages] = React.useState<ReferenceImage[]>([]);
  const [userPrompt, setUserPrompt] = React.useState('');
  const [selectedStyleId, setSelectedStyleId] = React.useState<string>(COVER_STYLES[0].id);
  const [history, setHistory] = React.useState<GenerationRecord[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  // 初始化时从 localStorage 加载历史记录
  React.useEffect(() => {
    setHistory(loadHistory());
    setIsMounted(true);
  }, []);

  // Hook
  const {
    isOptimizing,
    isGenerating,
    optimizedPrompt,
    error,
    generate,
  } = useCoverGeneration();

  // 处理参考图上传
  const handleImagesChange = (images: ReferenceImage[]) => {
    setReferenceImages(images);
  };

  // 处理生成 - 追加到历史记录
  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    const result = await generate({
      images: referenceImages,
      prompt: userPrompt,
      styleId: selectedStyleId,
    });

    if (result?.covers && result.optimizedPrompt) {
      const newRecord: GenerationRecord = {
        id: `gen-${Date.now()}`,
        timestamp: Date.now(),
        prompt: userPrompt,
        optimizedPrompt: result.optimizedPrompt,
        styleId: selectedStyleId,
        covers: result.covers,
      };
      const newHistory = [newRecord, ...history].slice(0, MAX_HISTORY_SIZE);
      setHistory(newHistory);
      saveHistory(newHistory);
    }
  };

  // 删除单个封面
  const handleDeleteCover = (coverId: string) => {
    const newHistory = history.map((record) => {
      const filteredCovers = record.covers.filter((c) => c.id !== coverId);
      return { ...record, covers: filteredCovers };
    }).filter((record) => record.covers.length > 0); // 移除没有图片的记录

    setHistory(newHistory);
    saveHistory(newHistory);
  };

  // 清空所有记录
  const handleClearAll = () => {
    setHistory([]);
    saveHistory([]);
  };

  // 判断是否可以生成（只需填写提示词即可）
  const canGenerate = userPrompt.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：配置面板 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 参考图上传 */}
          <Card className="rounded-xl">
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
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('styleSelect')}</CardTitle>
              <CardDescription>{t('styleSelectDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <StyleOptions
                selectedStyleId={selectedStyleId}
                onStyleChange={setSelectedStyleId}
                disabled={isGenerating || isOptimizing}
              />
            </CardContent>
          </Card>

          {/* 提示词输入 */}
          <Card className="rounded-xl">
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
                maxLength={5000}
                rows={6}
                autoResize={false}
              />
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating || isOptimizing}
              className="flex-1 rounded-xl"
            >
              {isGenerating || isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isOptimizing ? t('optimizing') : t('generating')}
                </>
              ) : (
                t('generate')
              )}
            </Button>
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

        {/* 右侧：预览区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 优化后的提示词 - 始终显示，有内容时带 loading 效果 */}
          {optimizedPrompt && (
            <Card className={cn(
              'rounded-xl transition-all',
              isGenerating && 'ring-2 ring-primary/30'
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{t('optimized')}</Badge>
                  {t('optimizedPrompt')}
                  {isGenerating && (
                    <Badge variant="outline" className="ml-2">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t('generating')}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  // Loading 状态 - 骨架屏
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                  </div>
                ) : (
                  // 正常状态 - 显示优化后的提示词
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {optimizedPrompt}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 历史生成记录 - 只在挂载后显示 */}
          {!isMounted ? (
            // 加载中 - 不显示任何内容，避免 hydration 不匹配
            null
          ) : history.length > 0 ? (
            <div className="space-y-6">
              {/* 清空全部按钮 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('generatedCovers')}</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {t('clearAll')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('confirmClearAll')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('confirmClearAllDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll}>
                        {t('confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* 遍历历史记录 */}
              {history.map((record) => (
                <div key={record.id} className="space-y-3">
                  {/* 记录头部 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {COVER_STYLES.find((s) => s.id === record.styleId)?.name || record.styleId}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>

                  {/* 封面卡片网格 - 3列 + 分页 */}
                  <CoversGrid
                    covers={record.covers}
                    prompt={record.optimizedPrompt}
                    onDeleteCover={handleDeleteCover}
                  />
                </div>
              ))}
            </div>
          ) : isGenerating ? (
            // Loading skeleton - 与 wallhaven 风格一致
            <div className="space-y-4">
              {/* 生成中提示 */}
              <Card className="rounded-xl">
                <CardContent className="py-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isOptimizing ? t('optimizing') : t('generating')}
                  </div>
                </CardContent>
              </Card>
              {/* 封面骨架屏 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-4/3 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : !optimizedPrompt ? (
            // 空状态 - 只有在没有优化提示词时才显示
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
