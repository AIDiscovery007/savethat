'use client';

/**
 * 全局错误边界
 * 捕获根级别未处理的错误
 */
import { Button } from '@/components/ui/button';
import { CircleDashed, SpinnerIcon } from '@phosphor-icons/react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="container max-w-md mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <CircleDashed className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">出错了</h1>
              <p className="text-muted-foreground">
                发生了意外错误，请稍后重试。
              </p>
              {error.message && process.env.NODE_ENV === 'development' && (
                <p className="text-sm text-destructive bg-destructive/5 p-2 rounded">
                  {error.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => reset()} variant="default">
                <SpinnerIcon className="mr-2 h-4 w-4" />
                重试
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
