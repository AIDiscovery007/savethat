'use client';

/**
 * 封面图片网格组件
 * 3x3 矩阵布局 + BlurFade 动画 + 分页
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { CoverCard } from './cover-card';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { GeneratedCover } from '../types';

/** 每页显示数量：3行 x 3列 = 9 */
const ITEMS_PER_PAGE = 9;

interface CoversGridProps {
  covers: GeneratedCover[];
  prompt: string;
  onDeleteCover?: (coverId: string) => void;
}

export function CoversGrid({ covers, prompt, onDeleteCover }: CoversGridProps) {
  const t = useTranslations('CoverGenerator');
  const [currentPage, setCurrentPage] = React.useState(1);

  // 计算总页数
  const totalPages = Math.ceil(covers.length / ITEMS_PER_PAGE);

  // 当 covers 变化时，确保页码有效（处理删除后的边界情况）
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [covers.length, currentPage, totalPages]);

  // 如果没有图片，不渲染
  if (covers.length === 0) {
    return null;
  }

  // 当前页的数据
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCovers = covers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 分页控制
  const goToPrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToPage = (page: number) => setCurrentPage(page);

  // 生成页码按钮（最多显示 5 个页码）
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* 网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {currentCovers.map((cover, idx) => (
          <BlurFade key={cover.id} delay={0.05 + idx * 0.03}>
            <div className="w-full">
              <CoverCard
                cover={cover}
                prompt={prompt}
                onDelete={onDeleteCover}
                className="w-full"
              />
            </div>
          </BlurFade>
        ))}
      </div>

      {/* 分页导航 - 仅在多于一页时显示 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {/* 上一页 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="h-8 px-2"
          >
            <CaretLeftIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">{t('previous')}</span>
          </Button>

          {/* 页码按钮 */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            )}
          </div>

          {/* 下一页 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">{t('next')}</span>
            <CaretRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
