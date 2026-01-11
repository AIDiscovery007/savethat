'use client';

/**
 * 历史记录面板组件
 * 显示优化历史记录列表
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, ConfirmDialogSimple } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { OptimizationHistory } from '@/lib/storage/types';
import {
  TrashIcon,
  ClockIcon,
  StarIcon,
  ListIcon,
} from '@phosphor-icons/react';

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
  const t = useTranslations('HistoryPanel');
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  const filteredRecords = React.useMemo(() => {
    if (!showFavoritesOnly) return records;
    return records.filter(r => r.isFavorite);
  }, [records, showFavoritesOnly]);

  return (
    <Card className={cn('h-full rounded-(--radius)', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListIcon className="h-5 w-5" />
            {t('title')}
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('confirmClear')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('clearDescription', { count: records.length })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onClearAll}>
                        {t('clear')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
        {records.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {t('recordsCount', { count: filteredRecords.length })}
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
                ? t('noFavorites')
                : t('noRecords')}
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
                t={t}
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
  t: ReturnType<typeof useTranslations>;
}

function HistoryItem({
  record,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite,
  t,
}: HistoryItemProps) {
  const [showActions, setShowActions] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    const date = new Date(record.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minsAgo', { mins: diffMins });
    if (diffHours < 24) return t('hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    return date.toLocaleDateString();
  }, [record.createdAt, t]);

  return (
    <div
      className={cn(
        'group relative rounded-(--radius) border p-3 transition-all duration-200 cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'hover:bg-muted/50 hover:border-primary/30'
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
          <div className="mb-1 line-clamp-2 text-xs wrap-break-word">
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
                <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}>
                  {t('delete')}
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
