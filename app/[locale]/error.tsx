'use client';

/**
 * 国际化路由错误边界
 * 捕获 /[locale] 路由段内的未处理错误
 */
import { Button } from '@/components/ui/button';
import { CircleDashed, SpinnerIcon } from '@phosphor-icons/react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <div className="rounded-full bg-destructive/10 p-4">
            <CircleDashed className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">发生了错误</h2>
            <p className="text-muted-foreground text-sm">
              {error.message || '请稍后重试'}
            </p>
            {process.env.NODE_ENV === 'development' && error.message && (
              <details className="text-left">
                <summary className="text-xs cursor-pointer text-muted-foreground">
                  错误详情
                </summary>
                <pre className="mt-2 text-xs bg-destructive/5 p-3 rounded overflow-auto">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>
          <Button onClick={() => reset()} variant="default">
            <SpinnerIcon className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      </div>
    </div>
  );
}
