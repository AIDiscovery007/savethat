'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AsyncImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  skeleton?: boolean;
  onLoad?: () => void;
}

/**
 * 异步图片加载组件
 * 统一图片加载状态处理（骨架屏、加载中、错误状态）
 */
export function AsyncImage({
  src,
  alt,
  fallback,
  skeleton = true,
  className,
  onLoad,
  onError,
  ...props
}: AsyncImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <div className={cn('relative', className)}>
      {skeleton && !loaded && !error && <Skeleton className="absolute inset-0" />}
      {!error && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(!loaded && !error && 'invisible', 'transition-opacity duration-300')}
          {...props}
        />
      )}
      {error && (fallback || <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Failed to load</div>)}
    </div>
  );
}
