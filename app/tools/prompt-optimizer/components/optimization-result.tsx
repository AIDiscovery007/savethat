'use client';

/**
 * 优化结果展示组件
 * 展示优化后的提示词和各阶段详情
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsRoot, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { OptimizationHistory, OptimizationStage } from '@/lib/storage/types';
import { CopyButton } from '@/components/copy-button';
import {
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
  SparkleIcon,
} from '@phosphor-icons/react';

interface OptimizationResultProps {
  result?: Partial<OptimizationHistory> & {
    originalPrompt: string;
    optimizedPrompt: string;
    modelId: string;
    modelName: string;
    stages: OptimizationStage[];
    totalDuration?: number;
  };
  className?: string;
}

export function OptimizationResult({ result, className }: OptimizationResultProps) {
  // 如果没有结果，返回空
  if (!result) {
    return null;
  }

  const [expandedStages, setExpandedStages] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<'split' | 'unified'>('unified');

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const allExpanded = expandedStages.size === result.stages.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 优化后的提示词 */}
      <div className="rounded-none border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">优化后的提示词</span>
          <CopyButton value={result.optimizedPrompt} />
        </div>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {result.optimizedPrompt}
        </pre>
      </div>

      {/* 查看方式切换 */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('unified')}
        >
          统一视图
        </Button>
        <Button
          variant={viewMode === 'split' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('split')}
        >
          分阶段查看
        </Button>
      </div>

      {viewMode === 'split' && (
        <>
          {/* 阶段列表 */}
          <div className="space-y-2">
            {result.stages.map((stage, index) => (
              <StageDetail
                key={stage.id}
                stage={stage}
                index={index}
                isExpanded={expandedStages.has(stage.id)}
                onToggle={() => toggleStage(stage.id)}
              />
            ))}
          </div>

          {/* 展开/收起全部 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (allExpanded) {
                setExpandedStages(new Set());
              } else {
                setExpandedStages(new Set(result.stages.map(s => s.id)));
              }
            }}
            className="w-full"
          >
            {allExpanded ? (
              <>
                <CaretUpIcon className="mr-2 h-4 w-4" />
                收起全部
              </>
            ) : (
              <>
                <CaretDownIcon className="mr-2 h-4 w-4" />
                展开全部
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * 单个阶段详情组件
 */
interface StageDetailProps {
  stage: OptimizationStage;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function StageDetail({ stage, index, isExpanded, onToggle }: StageDetailProps) {
  return (
    <div className="rounded-none border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{index + 1}</Badge>
          <span className="font-medium">{stage.name}</span>
        </div>
        {isExpanded ? (
          <CaretUpIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <CaretDownIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          <p className="text-sm text-muted-foreground">{stage.description}</p>

          {/* 输入 */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">输入</span>
            <pre className="mt-1 whitespace-pre-wrap rounded-none bg-muted/30 p-2 text-xs font-mono">
              {stage.input}
            </pre>
          </div>

          {/* 输出 */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">输出</span>
            <pre className="mt-1 whitespace-pre-wrap rounded-none bg-muted/30 p-2 text-xs font-mono max-h-[300px] overflow-auto">
              {stage.output}
            </pre>
          </div>

          {/* Token 统计 */}
          {stage.tokens && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                输入: {stage.tokens.prompt} tokens
              </span>
              <span>
                输出: {stage.tokens.completion} tokens
              </span>
              <span>
                总计: {stage.tokens.total} tokens
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
