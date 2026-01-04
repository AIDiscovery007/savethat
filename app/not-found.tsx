'use client';

import Link from 'next/link';
import { HouseIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

/**
 * 404 Not Found 页面
 * 当访问不存在的路由时显示
 */
export default function NotFound() {
  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <div className="rounded-full bg-muted/50 p-6">
            <WarningIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">页面未找到</p>
            <p className="text-sm text-muted-foreground/80">
              您访问的页面可能已被移动或删除
            </p>
          </div>
        </div>
        <Link href="/">
          <Button variant="default">
            <HouseIcon className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
