'use client';

/**
 * 全局加载页面
 * 在路由切换和数据获取期间显示
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">加载中...</p>
      </div>
    </div>
  );
}
