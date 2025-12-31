'use client';

/**
 * 对比视图组件
 * 并排显示原提示词和优化后提示词
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/copy-button';
import { ArrowsLeftRightIcon, ColumnsIcon } from '@phosphor-icons/react';

interface ComparisonViewProps {
  originalPrompt: string;
  optimizedPrompt: string;
  className?: string;
}

export function ComparisonView({
  originalPrompt,
  optimizedPrompt,
  className,
}: ComparisonViewProps) {
  const [viewMode, setViewMode] = React.useState<'split' | 'single'>('split');

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ColumnsIcon className="h-5 w-5" />
            对比视图
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
            >
              <ArrowsLeftRightIcon className="mr-1 h-4 w-4" />
              并排
            </Button>
            <Button
              variant={viewMode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('single')}
            >
              上下
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'split' ? (
          <SplitView
            originalPrompt={originalPrompt}
            optimizedPrompt={optimizedPrompt}
          />
        ) : (
          <StackedView
            originalPrompt={originalPrompt}
            optimizedPrompt={optimizedPrompt}
          />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 并排视图
 */
function SplitView({
  originalPrompt,
  optimizedPrompt,
}: {
  originalPrompt: string;
  optimizedPrompt: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 原始提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            原始提示词
          </span>
          <CopyButton value={originalPrompt} />
        </div>
        <div className="h-[200px] overflow-auto rounded-none border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {originalPrompt}
          </pre>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {originalPrompt.length} 字符
        </div>
      </div>

      {/* 优化后提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            优化后提示词
          </span>
          <CopyButton value={optimizedPrompt} />
        </div>
        <div className="h-[200px] overflow-auto rounded-none border border-green-500/30 bg-green-50/30 p-3 dark:bg-green-900/10">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {optimizedPrompt}
          </pre>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {optimizedPrompt.length} 字符
          {optimizedPrompt.length !== originalPrompt.length && (
            <span className="ml-2 text-green-600">
              ({optimizedPrompt.length - originalPrompt.length > 0 ? '+' : ''}
              {optimizedPrompt.length - originalPrompt.length})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 上下堆叠视图
 */
function StackedView({
  originalPrompt,
  optimizedPrompt,
}: {
  originalPrompt: string;
  optimizedPrompt: string;
}) {
  return (
    <div className="space-y-4">
      {/* 原始提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            原始提示词
          </span>
          <CopyButton value={originalPrompt} />
        </div>
        <div className="min-h-[100px] max-h-[200px] overflow-auto rounded-none border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {originalPrompt}
          </pre>
        </div>
      </div>

      {/* 优化后提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            优化后提示词
          </span>
          <CopyButton value={optimizedPrompt} />
        </div>
        <div className="min-h-[100px] max-h-[200px] overflow-auto rounded-none border border-green-500/30 bg-green-50/30 p-3 dark:bg-green-900/10">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {optimizedPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}
