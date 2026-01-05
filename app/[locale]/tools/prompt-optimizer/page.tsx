'use client';

/**
 * 提示词优化工具主页面
 * 整合所有组件，提供完整的优化体验
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_MODEL_ID, getModelById } from '@/lib/api/aihubmix/models';
import { createHistoryRecord, useHistory } from '@/lib/hooks/use-history';
import { useOptimization } from '@/lib/hooks/use-optimization';
import { STAGES } from '@/lib/prompts/prompt-optimizer/system-prompts';
import { OptimizerForm } from './components/optimizer-form';
import { StageIndicator, ProgressWithLabel } from './components/stage-indicator';
import { OptimizationResult } from './components/optimization-result';
import { AIClientSender } from './components/ai-client-sender';
import { ComparisonView } from './components/comparison-view';
import { HistoryPanel } from './components/history-panel';
import { TabsRoot, TabsList, TabsTab } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  MagicWandIcon,
  InfoIcon,
  ListIcon,
} from '@phosphor-icons/react';
import type { OptimizationHistory } from '@/lib/storage/types';

export default function PromptOptimizerPage() {
  const t = useTranslations('PromptOptimizer');

  // 状态管理
  const [prompt, setPrompt] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState(DEFAULT_MODEL_ID);
  const [thinkingEnabled, setThinkingEnabled] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'result' | 'comparison'>('result');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = React.useState<OptimizationHistory | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const isRestoringResult = React.useRef(false);

  // 确保 Hydration 匹配
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hooks
  const {
    isOptimizing,
    currentStage,
    stageProgress,
    result,
    error,
    optimize,
    reset,
  } = useOptimization();

  const {
    records,
    isLoading,
    saveRecord,
    deleteRecord,
    clearHistory,
    toggleFavorite,
  } = useHistory();

  // 获取当前阶段名称
  const currentStageName = currentStage
    ? STAGES.find(s => s.id === currentStage)?.name
    : null;

  // 加载历史记录后自动选中第一条
  React.useEffect(() => {
    if (records.length > 0 && !selectedHistoryRecord && !prompt) {
      const firstRecord = records[0];
      // 确保有 totalDuration 字段（旧记录可能没有）
      const recordWithDuration: OptimizationHistory = {
        ...firstRecord,
        totalDuration: firstRecord.totalDuration ?? 0,
      };
      setSelectedHistoryRecord(recordWithDuration);
      setPrompt(firstRecord.originalPrompt);
      setSelectedModel(firstRecord.modelId);
    } else if (records.length === 0 && !isRestoringResult.current) {
      // 历史记录被清空时，清除选中状态和优化结果
      // 但在保存新记录期间不执行 reset，避免清除刚完成的优化结果
      setSelectedHistoryRecord(null);
      reset();
    }
  }, [records, selectedHistoryRecord, prompt]);

  // 处理优化
  const handleOptimize = async () => {
    if (!prompt.trim()) return;

    const modelInfo = getModelById(selectedModel);
    if (!modelInfo) return;

    const optimizationResult = await optimize(prompt, selectedModel, modelInfo.name, undefined, thinkingEnabled);

    if (optimizationResult) {
      // 标记正在恢复结果，避免 loadHistory 事件触发时误执行 reset
      isRestoringResult.current = true;

      // 保存到历史记录
      const historyRecord = createHistoryRecord(
        prompt,
        optimizationResult.optimizedPrompt,
        selectedModel,
        modelInfo.name,
        optimizationResult.stages,
        optimizationResult.totalDuration
      );
      await saveRecord(historyRecord);

      // 自动选中刚保存的记录
      setSelectedHistoryRecord(historyRecord);

      // 清空输入
      setPrompt('');

      // 清除恢复标记
      isRestoringResult.current = false;
    }
  };

  // 处理选择历史记录
  const handleSelectHistory = (record: OptimizationHistory) => {
    setPrompt(record.originalPrompt);
    setSelectedModel(record.modelId);
    // 确保有 totalDuration 字段（旧记录可能没有）
    const recordWithDuration: OptimizationHistory = {
      ...record,
      totalDuration: record.totalDuration ?? 0,
    };
    setSelectedHistoryRecord(recordWithDuration);
    setViewMode('result');
  };

  // 格式化耗时
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '0s';
    return t('duration', { seconds: Math.round(ms / 1000) });
  };

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
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：提示词记录（桌面端显示） */}
        <div className="hidden lg:block space-y-6">
          <HistoryPanel
            records={records}
            isLoading={isLoading}
            selectedId={selectedHistoryRecord?.id}
            onSelect={handleSelectHistory}
            onDelete={deleteRecord}
            onToggleFavorite={toggleFavorite}
            onClearAll={clearHistory}
          />
        </div>

        {/* 移动端：历史记录抽屉触发按钮 */}
        <div className="lg:hidden">
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full gap-2 rounded-[var(--radius)]">
                  <ListIcon className="h-4 w-4" />
                  {t('history')}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] transition-all duration-200">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <ListIcon className="h-5 w-5" />
                    {t('history')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto h-[calc(60vh-4rem)]">
                  <HistoryPanel
                    records={records}
                    isLoading={isLoading}
                    selectedId={selectedHistoryRecord?.id}
                    onSelect={(record) => {
                      handleSelectHistory(record);
                    }}
                    onDelete={deleteRecord}
                    onToggleFavorite={toggleFavorite}
                    onClearAll={clearHistory}
                    className="border-0 shadow-none"
                  />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="outline" className="w-full gap-2 rounded-[var(--radius)]" disabled>
              <ListIcon className="h-4 w-4" />
              {t('history')}
            </Button>
          )}
        </div>

        {/* 中间：表单和结果 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 优化表单 */}
          <OptimizerForm
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleOptimize}
            isOptimizing={isOptimizing}
            disabled={!selectedModel}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            thinkingEnabled={thinkingEnabled}
            onThinkingChange={setThinkingEnabled}
          />

          {/* 优化进度指示器 */}
          {isOptimizing && (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="pt-6">
                <StageIndicator
                  currentStage={currentStage}
                  stageProgress={stageProgress}
                />
                <div className="mt-4">
                  <ProgressWithLabel
                    progress={stageProgress}
                    label={
                      currentStage && currentStageName
                        ? t('optimizing', { stage: currentStageName })
                        : t('preparing')
                    }
                    subLabel={error || t('preparing')}
                  />
                </div>
                {error && (
                  <div className="mt-2 text-sm text-destructive">
                    {t('error', { error })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 优化结果 */}
          {selectedHistoryRecord || result ? (
            <>
              {/* 发送到AI客户端 - 固定显示在 Card 外部 */}
              <AIClientSender prompt={(selectedHistoryRecord ?? result)?.optimizedPrompt || ''} />

              <Card className="rounded-[var(--radius)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MagicWandIcon className="h-5 w-5 text-green-500" />
                      {t('optimizedResult')}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {selectedHistoryRecord && (
                        <Badge variant="outline">
                          {new Date(selectedHistoryRecord.createdAt).toLocaleString()}
                        </Badge>
                      )}
                      <TabsRoot value={viewMode} onValueChange={(v) => setViewMode(v as 'result' | 'comparison')}>
                        <TabsList>
                          <TabsTab value="result">{t('detail')}</TabsTab>
                          <TabsTab value="comparison">{t('comparison')}</TabsTab>
                        </TabsList>
                      </TabsRoot>
                    </div>
                  </div>
                  {/* 模型和耗时信息 */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {(selectedHistoryRecord ?? result)?.modelName}
                    </span>
                    <span>·</span>
                    <span>
                      {formatDuration((selectedHistoryRecord ?? result)?.totalDuration)}
                    </span>
                    {selectedHistoryRecord && (
                      <>
                        <span>·</span>
                        <span>{t('history')}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'result' ? (
                    <OptimizationResult result={selectedHistoryRecord ?? result ?? undefined} />
                  ) : (
                    <ComparisonView
                      originalPrompt={selectedHistoryRecord?.originalPrompt || result?.originalPrompt || ''}
                      optimizedPrompt={selectedHistoryRecord?.optimizedPrompt || result?.optimizedPrompt || ''}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            // 没有结果时显示提示
            <Card className="rounded-[var(--radius)]">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <InfoIcon className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {t('noRecords')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {t('instruction')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
