'use client';

/**
 * 封面图片网格组件
 * 瀑布流布局 + BlurFade 动画 - 创意趣味风格
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BlurFade } from '@/components/ui/blur-fade';
import { CoverCard } from './cover-card';
import type { GeneratedCover } from '../types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CoversGridProps {
  covers: GeneratedCover[];
  prompt: string;
  onDeleteCover?: (coverId: string) => void;
}

export function CoversGrid({ covers, prompt, onDeleteCover }: CoversGridProps) {
  const t = useTranslations('CoverGenerator');

  // 如果没有图片，不渲染
  if (covers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 瀑布流布局 - columns 实现 */}
      {/* 使用 break-inside-avoid 确保卡片不被截断 */}
      <div className="columns-2 gap-4 sm:columns-3 [&>*]:break-inside-avoid">
        {covers.map((cover, idx) => (
          <BlurFade key={cover.id} delay={0.1 + idx * 0.05}>
            <CoverCard
              cover={cover}
              prompt={prompt}
              onDelete={onDeleteCover}
              className="mb-4"
            />
          </BlurFade>
        ))}
      </div>
    </div>
  );
}
