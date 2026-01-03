'use client';

/**
 * 阶段指示器组件
 * 显示当前优化阶段和进度
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { STAGES, StageEnum } from '@/lib/prompts/prompt-optimizer/system-prompts';
import { CheckCircle, Circle, CircleDashed } from '@phosphor-icons/react';

interface StageIndicatorProps {
  currentStage: StageEnum | null;
  stageProgress: number;
  className?: string;
}

export function StageIndicator({
  currentStage,
  stageProgress,
  className,
}: StageIndicatorProps) {
  // 计算每个阶段的状态
  const getStageStatus = (stageIndex: number): 'completed' | 'current' | 'pending' => {
    if (!currentStage) return 'pending';

    const currentIndex = STAGES.findIndex(s => s.id === currentStage);
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {STAGES.map((stage, index) => {
        const status = getStageStatus(index);
        const isLast = index === STAGES.length - 1;

        return (
          <React.Fragment key={stage.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center',
                  status === 'completed' && 'text-green-500',
                  status === 'current' && 'text-blue-500',
                  status === 'pending' && 'text-muted-foreground'
                )}
              >
                {status === 'completed' && (
                  <CheckCircle className="h-5 w-5" />
                )}
                {status === 'current' && (
                  <CircleDashed className="h-5 w-5 animate-spin" />
                )}
                {status === 'pending' && (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  status === 'completed' && 'text-green-500',
                  status === 'current' && 'text-blue-500',
                  status === 'pending' && 'text-muted-foreground'
                )}
              >
                {stage.name}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'h-px w-8',
                  index < STAGES.findIndex(s => s.id === currentStage!)
                    ? 'bg-green-500'
                    : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 进度条组件
 */
interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * 带标签的进度组件
 */
interface ProgressWithLabelProps {
  progress: number;
  label: string;
  subLabel?: string;
  className?: string;
}

export function ProgressWithLabel({
  progress,
  label,
  subLabel,
  className,
}: ProgressWithLabelProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <ProgressBar progress={progress} />
      {subLabel && (
        <p className="text-xs text-muted-foreground">{subLabel}</p>
      )}
    </div>
  );
}
