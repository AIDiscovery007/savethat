'use client';

import { useState, useEffect } from 'react';

/**
 * 检测组件是否已挂载的 Hook
 * 用于避免服务端渲染时的水合问题
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
