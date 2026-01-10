'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
}

/**
 * 错误展示组件
 * 统一工具页面的错误展示区域
 */
export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <Card className={cn('rounded-[var(--radius)] border-destructive', className)}>
      <CardContent className="pt-4">
        <p className="text-sm text-destructive">{error}</p>
      </CardContent>
    </Card>
  );
}
