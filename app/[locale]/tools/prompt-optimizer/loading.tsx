import { Skeleton, SkeletonCard, SkeletonList, SkeletonText } from '@/components/ui/skeleton';

/**
 * 提示词优化工具加载页面
 * 使用骨架屏提供更好的加载体验
 */
export default function PromptOptimizerLoading() {
  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-6">
      {/* 头部骨架 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧 - 输入卡片 */}
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard />
          <div className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-[100px]" />
            <SkeletonText lines={4} />
          </div>
        </div>

        {/* 右侧 - 历史记录 */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-[80px]" />
          <SkeletonList items={5} />
        </div>
      </div>
    </div>
  );
}
