'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  loadingText?: string;
  children: ReactNode;
}

/**
 * 提交按钮组件
 * 统一工具页面的加载状态按钮展示
 */
export function SubmitButton({
  loading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button disabled={loading || disabled} className={cn('gap-2', className)} {...props}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
