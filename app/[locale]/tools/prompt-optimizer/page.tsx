'use client';

/**
 * 提示词优化工具主页面
 * 整合所有组件，提供完整的优化体验
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DEFAULT_MODEL_ID, getModelById } from '@/lib/api/aihubmix/models';
import { createHistoryRecord, generateId, useHistory } from '@/lib/hooks/use-history';
import { useOptimization } from '@/lib/hooks/use-optimization';
import { STAGES, StageEnum } from '@/lib/prompts/prompt-optimizer/system-prompts';
import { OptimizerForm } from './components/optimizer-form';
import { StageIndicator, ProgressWithLabel } from './components/stage-indicator';
import { OptimizationResult } from './components/optimization-result';
import { ComparisonView } from './components/comparison-view';
import { HistoryPanel } from './components/history-panel';
import { TabsRoot, TabsList, TabsTab } from '@/components/ui/tabs';
import {
  MagicWandIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import type { OptimizationHistory } from '@/lib/storage/types';
import type { OptimizationResult as UseOptimizationResult } from '@/lib/hooks/use-optimization';

export default function PromptOptimizerPage() {
  const t = useTranslations('PromptOptimizer');

  // 状态管理
  const [prompt, setPrompt] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState(DEFAULT_MODEL_ID);
  const [thinkingEnabled, setThinkingEnabled] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'result' | 'comparison'>('result');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = React.useState<OptimizationHistory | null>(null);

  // Hooks
  const {
    isOptimizing,
    currentStage,
    stageProgress,
    stages,
    result,
    error,
    optimize,
  } = useOptimization();

  const {
    records,
    isLoading,
    saveRecord,
    deleteRecord,
    updateRecord,
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
    }
  }, [records, selectedHistoryRecord, prompt]);

  // 处理优化
  const handleOptimize = async () => {
    if (!prompt.trim()) return;

    const modelInfo = getModelById(selectedModel);
    if (!modelInfo) return;

    const optimizationResult = await optimize(prompt, selectedModel, modelInfo.name, undefined, thinkingEnabled);

    if (optimizationResult) {
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

      // 清空输入
      setPrompt('');
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
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
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
        {/* 左侧：提示词记录 */}
        <div className="space-y-6">
          {/* 提示词记录面板 */}
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
            <Card>
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
            <Card>
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
          ) : (
            // 没有结果时显示提示
            <Card>
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
