/**
 * 滑雪分析工具 404 页面
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HouseIcon, ArrowLeftIcon } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 rounded-[var(--radius)]">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-6">
            页面未找到
          </p>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/">
                <HouseIcon className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tools/ski-analysis">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                访问工具
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
