'use client';

/**
 * 提示词优化工具主页面
 * 整合所有组件，提供完整的优化体验
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DEFAULT_MODEL_ID, getModelById } from '@/lib/api/aihubmix/models';
import { createHistoryRecord, generateId, useHistory } from '@/lib/hooks/use-history';
import { useOptimization } from '@/lib/hooks/use-optimization';
import { STAGES, OptimizationStage } from '@/lib/prompts/prompt-optimizer/system-prompts';
import { ModelSelector } from './components/model-selector';
import { OptimizerForm } from './components/optimizer-form';
import { StageIndicator, ProgressWithLabel } from './components/stage-indicator';
import { OptimizationResult } from './components/optimization-result';
import { ComparisonView } from './components/comparison-view';
import { HistoryPanel } from './components/history-panel';
import { TabsRoot, TabsList, TabsTab } from '@/components/ui/tabs';
import {
  MagicWandIcon,
  GearIcon,
  ArrowUUpLeftIcon,
} from '@phosphor-icons/react';
import type { OptimizationHistory, OptimizationResult as OptimizationResultType } from '@/lib/storage/types';

export default function PromptOptimizerPage() {
  // 状态管理
  const [prompt, setPrompt] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState(DEFAULT_MODEL_ID);
  const [showSettings, setShowSettings] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'result' | 'comparison'>('result');

  // Hooks
  const {
    isOptimizing,
    currentStage,
    stageProgress,
    stages,
    result,
    error,
    optimize,
    reset: resetOptimization,
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

  // 处理优化
  const handleOptimize = async () => {
    if (!prompt.trim()) return;

    const modelInfo = getModelById(selectedModel);
    if (!modelInfo) return;

    const optimizationResult = await optimize(prompt, selectedModel, modelInfo.name);

    if (optimizationResult) {
      // 保存到历史记录
      const historyRecord = createHistoryRecord(
        prompt,
        optimizationResult.optimizedPrompt,
        selectedModel,
        modelInfo.name,
        optimizationResult.stages
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
  };

  // 重置所有状态
  const handleReset = () => {
    setPrompt('');
    setSelectedModel(DEFAULT_MODEL_ID);
    resetOptimization();
  };

  // 监听优化阶段变化
  React.useEffect(() => {
    if (currentStage) {
      const progressMap: Record<OptimizationStage, number> = {
        [OptimizationStage.INTENT_ANALYSIS]: 33,
        [OptimizationStage.STRUCTURING]: 66,
        [OptimizationStage.REFINEMENT]: 90,
      };
      // 进度已在 useOptimization hook 中管理
    }
  }, [currentStage]);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">提示词优化工具</h1>
          <p className="text-muted-foreground">
            基于 AI 的三阶段提示词优化流程
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <GearIcon className="mr-2 h-4 w-4" />
            模型设置
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowUUpLeftIcon className="mr-2 h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：模型选择和历史记录 */}
        <div className="space-y-6">
          {/* 模型选择器 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">选择模型</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelSelector
                value={selectedModel}
                onValueChange={setSelectedModel}
              />
              {getModelById(selectedModel) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {getModelById(selectedModel)?.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 历史记录面板 */}
          <HistoryPanel
            records={records}
            isLoading={isLoading}
            onSelect={handleSelectHistory}
            onDelete={deleteRecord}
            onToggleFavorite={toggleFavorite}
            onClearAll={clearHistory}
          />
        </div>

        {/* 中间：表单和结果 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 优化表单 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MagicWandIcon className="h-5 w-5" />
                输入提示词
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OptimizerForm
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleOptimize}
                isOptimizing={isOptimizing}
                disabled={!selectedModel}
              />
            </CardContent>
          </Card>

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
                      currentStage
                        ? `正在${STAGES.find(s => s.id === currentStage)?.name}...`
                        : '准备中'
                    }
                    subLabel={error || '请稍候...'}
                  />
                </div>
                {error && (
                  <div className="mt-2 text-sm text-destructive">
                    错误: {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 优化结果 */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">优化结果</CardTitle>
                  <TabsRoot value={viewMode} onValueChange={(v) => setViewMode(v as 'result' | 'comparison')}>
                    <TabsList size="sm">
                      <TabsTab value="result" size="sm">详情</TabsTab>
                      <TabsTab value="comparison" size="sm">对比</TabsTab>
                    </TabsList>
                  </TabsRoot>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'result' ? (
                  <OptimizationResult result={result} />
                ) : (
                  <ComparisonView
                    originalPrompt={result.originalPrompt}
                    optimizedPrompt={result.optimizedPrompt}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
