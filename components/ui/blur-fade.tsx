'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  inView?: boolean;
}

export function BlurFade({
  children,
  delay = 0,
  className,
  inView = true,
}: BlurFadeProps) {
  const [isVisible, setIsVisible] = React.useState(!inView);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-md',
        className
      )}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
