'use client';

import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarClassName?: string;
  childrenClassName?: string;
  className?: string;
}

/**
 * 两列布局组件
 * 统一工具页面的主内容区域布局
 */
export function TwoColumnLayout({
  sidebar,
  children,
  sidebarClassName,
  childrenClassName,
  className,
}: TwoColumnLayoutProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      <div className={cn('space-y-6', sidebarClassName)}>{sidebar}</div>
      <div className={cn('lg:col-span-2', childrenClassName)}>{children}</div>
    </div>
  );
}
