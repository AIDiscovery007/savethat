'use client';

/**
 * 生成预览组件
 * 显示生成过程中的加载状态
 */

import * as React from 'react';
import { Spinner, ImageIcon } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GenerationPreviewProps {
  isGenerating?: boolean;
  progress?: number;
  stage?: 'optimizing' | 'generating';
}

export function GenerationPreview({
  isGenerating = false,
  progress = 0,
  stage = 'generating',
}: GenerationPreviewProps) {
  return (
    <Card className="rounded-[var(--radius)]">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* 动画图标 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isGenerating ? (
                <Spinner className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
            </div>

            {/* 脉冲动画 */}
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
          </div>

          {/* 状态文字 */}
          <div className="text-center space-y-1">
            <p className="font-medium">
              {stage === 'optimizing' ? '正在优化提示词...' : '正在生成封面...'}
            </p>
            <p className="text-sm text-muted-foreground">
              这可能需要几秒钟时间，请稍候
            </p>
          </div>

          {/* 进度条 */}
          {isGenerating && (
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress}%
              </p>
            </div>
          )}

          {/* 步骤指示 */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`w-2 h-2 rounded-full ${
                stage === 'optimizing' || progress > 0
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
            <div className="w-8 h-px bg-muted" />
            <div
              className={`w-2 h-2 rounded-full ${
                stage === 'generating' && progress > 0
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>优化提示词</span>
            <span>生成图像</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
