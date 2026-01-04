/**
 * 国际化路由加载页面
 * 在 /[locale] 路由段加载时显示
 */
export default function LocaleLoading() {
  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-muted animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">加载中...</p>
      </div>
    </div>
  );
}
