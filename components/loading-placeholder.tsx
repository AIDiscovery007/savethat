'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingPlaceholderProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * 加载占位组件
 * 统一工具页面的加载中展示区域
 */
export function LoadingPlaceholder({ message, icon, className }: LoadingPlaceholderProps) {
  return (
    <Card className={cn('rounded-[var(--radius)]', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16">
        {icon || <Loader2 className="h-10 w-10 animate-spin mb-4" />}
        <h3 className="text-lg font-semibold">{message}</h3>
      </CardContent>
    </Card>
  );
}
