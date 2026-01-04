'use client';

/**
 * 对比视图组件
 * 并排显示原提示词和优化后提示词
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('ComparisonView');
  const [viewMode, setViewMode] = React.useState<'split' | 'single'>('split');
  const charDiff = optimizedPrompt.length - originalPrompt.length;

  return (
    <Card className={cn('rounded-[var(--radius)]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ColumnsIcon className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
            >
              <ArrowsLeftRightIcon className="mr-1 h-4 w-4" />
              {t('sideBySide')}
            </Button>
            <Button
              variant={viewMode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('single')}
            >
              {t('stacked')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'split' ? (
          <SplitView
            originalPrompt={originalPrompt}
            optimizedPrompt={optimizedPrompt}
            charDiff={charDiff}
            t={t}
          />
        ) : (
          <StackedView
            originalPrompt={originalPrompt}
            optimizedPrompt={optimizedPrompt}
            t={t}
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
  charDiff,
  t,
}: {
  originalPrompt: string;
  optimizedPrompt: string;
  charDiff: number;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 原始提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t('originalPrompt')}
          </span>
          <CopyButton value={originalPrompt} />
        </div>
        <div className="h-[200px] overflow-auto rounded-[var(--radius)] border bg-muted/30 p-3 transition-all duration-200">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {originalPrompt}
          </pre>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {t('chars', { chars: originalPrompt.length })}
        </div>
      </div>

      {/* 优化后提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            {t('optimizedPrompt')}
          </span>
          <CopyButton value={optimizedPrompt} />
        </div>
        <div className="h-[200px] overflow-auto rounded-[var(--radius)] border border-green-500/30 bg-green-50/30 p-3 dark:bg-green-900/10 transition-all duration-200">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {optimizedPrompt}
          </pre>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {t('chars', { chars: optimizedPrompt.length })}
          {charDiff !== 0 && (
            <span className="ml-2 text-green-600">
              ({charDiff > 0 ? '+' : ''}{charDiff})
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
  t,
}: {
  originalPrompt: string;
  optimizedPrompt: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      {/* 原始提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t('originalPrompt')}
          </span>
          <CopyButton value={originalPrompt} />
        </div>
        <div className="min-h-[100px] max-h-[200px] overflow-auto rounded-[var(--radius)] border bg-muted/30 p-3 transition-all duration-200">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {originalPrompt}
          </pre>
        </div>
      </div>

      {/* 优化后提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            {t('optimizedPrompt')}
          </span>
          <CopyButton value={optimizedPrompt} />
        </div>
        <div className="min-h-[100px] max-h-[200px] overflow-auto rounded-[var(--radius)] border border-green-500/30 bg-green-50/30 p-3 dark:bg-green-900/10 transition-all duration-200">
          <pre className="whitespace-pre-wrap text-xs font-mono">
            {optimizedPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}
