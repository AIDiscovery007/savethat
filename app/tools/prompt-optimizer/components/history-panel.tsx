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
  ListIcon,
} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface HistoryPanelProps {
  records: OptimizationHistory[];
  isLoading: boolean;
  selectedId?: string | null;
  onSelect: (record: OptimizationHistory) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function HistoryPanel({
  records,
  isLoading,
  selectedId,
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
            提示词记录
          </CardTitle>
          {records.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(showFavoritesOnly && 'bg-muted')}
              >
                <StarIcon className="h-3 w-3 fill-yellow-500" />
              </Button>
              {records.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClearAll}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        {records.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {filteredRecords.length} 条记录
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
                : '暂无提示词记录'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredRecords.map(record => (
              <HistoryItem
                key={record.id}
                record={record}
                isSelected={selectedId === record.id}
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
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function HistoryItem({
  record,
  isSelected,
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
      className={cn(
        'group relative rounded-none border p-3 transition-colors cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'hover:bg-muted/50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 text-left"
        >
          <div className="mb-1 line-clamp-2 text-xs break-words">
            {record.originalPrompt}
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <TrashIcon className="h-3 w-3 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除这条提示词记录吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}>
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
