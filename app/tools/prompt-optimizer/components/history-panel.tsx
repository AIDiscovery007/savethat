'use client';

/**
 * 历史记录面板组件
 * 显示优化历史记录列表
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OptimizationHistory } from '@/lib/storage/types';
import {
  TrashIcon,
  ClockIcon,
  StarIcon,
  ArrowUUpLeftIcon,
  ListIcon,
} from '@phosphor-icons/react';

interface HistoryPanelProps {
  records: OptimizationHistory[];
  isLoading: boolean;
  onSelect: (record: OptimizationHistory) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function HistoryPanel({
  records,
  isLoading,
  onSelect,
  onDelete,
  onToggleFavorite,
  onClearAll,
  className,
}: HistoryPanelProps) {
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  const filteredRecords = React.useMemo(() => {
    if (!showFavoritesOnly) return records;
    return records.filter(r => r.isFavorite);
  }, [records, showFavoritesOnly]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListIcon className="h-5 w-5" />
            历史记录
          </CardTitle>
          {records.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(showFavoritesOnly && 'bg-muted')}
            >
              <StarIcon className="h-3 w-3 fill-yellow-500" />
            </Button>
          )}
        </div>
        {records.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredRecords.length} 条记录</span>
            {records.length > 1 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onClearAll}
                className="h-auto p-0 text-destructive hover:text-destructive"
              >
                <TrashIcon className="mr-1 h-3 w-3" />
                清空
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ClockIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {showFavoritesOnly
                ? '暂无收藏的记录'
                : '暂无历史记录'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredRecords.map(record => (
              <HistoryItem
                key={record.id}
                record={record}
                onSelect={() => onSelect(record)}
                onDelete={() => onDelete(record.id)}
                onToggleFavorite={() => onToggleFavorite(record.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 单条历史记录项
 */
interface HistoryItemProps {
  record: OptimizationHistory;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function HistoryItem({
  record,
  onSelect,
  onDelete,
  onToggleFavorite,
}: HistoryItemProps) {
  const [showActions, setShowActions] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    const date = new Date(record.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  }, [record.createdAt]);

  return (
    <div
      className="group relative rounded-none border p-3 transition-colors hover:bg-muted/50"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 text-left"
        >
          <div className="mb-1 line-clamp-2 text-xs">
            {record.originalPrompt.slice(0, 100)}
            {record.originalPrompt.length > 100 && '...'}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {record.modelName}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formattedDate}
            </span>
          </div>
        </button>

        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            {record.isFavorite ? (
              <StarIcon className="h-3 w-3 fill-yellow-500" />
            ) : (
              <StarIcon className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <ArrowUUpLeftIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <TrashIcon className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>

      {record.isFavorite && (
        <div className="absolute right-2 top-2">
          <StarIcon className="h-3 w-3 fill-yellow-500" />
        </div>
      )}
    </div>
  );
}
