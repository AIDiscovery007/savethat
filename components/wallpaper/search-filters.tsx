'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  categories: string;
  onCategoriesChange: (categories: string) => void;
  purity: string;
  onPurityChange: (purity: string) => void;
  sorting: string;
  onSortingChange: (sorting: string) => void;
  resolution: string;
  onResolutionChange: (resolution: string) => void;
  atleast: string;
  onAtleastChange: (atleast: string) => void;
  onSearch: () => void;
  className?: string;
}

// 分类选项
const CATEGORIES_OPTIONS = [
  { value: '110', label: 'General' },
  { value: '010', label: 'Anime' },
  { value: '100', label: 'People' },
  { value: '111', label: 'All' },
];

// 纯度选项
const PURITY_OPTIONS = [
  { value: '100', label: 'SFW' },
  { value: '110', label: '+ Sketchy' },
  { value: '111', label: 'All (NSFW)' },
];

// 排序选项
const SORTING_OPTIONS = [
  { value: 'date_added', label: 'Newest' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'random', label: 'Random' },
  { value: 'views', label: 'Popular' },
  { value: 'toplist', label: 'Top List' },
];

// 精确尺寸选项
const RESOLUTION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '1920x1080', label: 'Full HD' },
  { value: '2560x1440', label: '2K' },
  { value: '3840x2160', label: '4K' },
  { value: '5120x2880', label: '5K' },
];

// 最小尺寸选项
const ATLEAST_OPTIONS = [
  { value: 'any', label: 'No min' },
  { value: '1920x1080', label: '1920×1080+' },
  { value: '2560x1440', label: '2560×1440+' },
  { value: '3840x2160', label: '3840×2160+' },
];

// 紧凑标签组件
function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <Badge
        variant="secondary"
        className={cn(
          'text-xs px-2 py-0.5 h-5 gap-1 cursor-pointer',
          onRemove && 'pr-1'
        )}
        onClick={onRemove}
      >
        {label}
        {onRemove && (
          <X className="h-3 w-3 ml-0.5 hover:text-destructive" />
        )}
      </Badge>
    </motion.div>
  );
}

export function SearchFilters({
  query,
  onQueryChange,
  categories,
  onCategoriesChange,
  purity,
  onPurityChange,
  sorting,
  onSortingChange,
  resolution,
  onResolutionChange,
  atleast,
  onAtleastChange,
  onSearch,
  className,
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Filter definitions with labels and defaults
  const filterDefs = [
    { key: 'cat', value: categories, default: '110', options: CATEGORIES_OPTIONS, set: onCategoriesChange },
    { key: 'pur', value: purity, default: '100', options: PURITY_OPTIONS, set: onPurityChange },
    { key: 'sort', value: sorting, default: 'date_added', options: SORTING_OPTIONS, set: onSortingChange },
    { key: 'res', value: resolution, default: 'any', options: RESOLUTION_OPTIONS, set: onResolutionChange },
    { key: 'atleast', value: atleast, default: 'any', options: ATLEAST_OPTIONS, set: onAtleastChange },
  ] as const;

  // 计算活跃筛选数量（排除默认值）
  const activeFilters = React.useMemo(() => {
    return filterDefs
      .filter(({ value, default: def }) => value !== def)
      .map(({ key, value, options }) => {
        const opt = options.find((o) => o.value === value);
        return { label: opt?.label ?? '', value, key };
      });
  }, [categories, purity, sorting, resolution, atleast]);

  // Default values for resetting filters
  const defaultValues: Record<string, string> = {
    cat: '110',
    pur: '100',
    sort: 'date_added',
    res: 'any',
    atleast: 'any',
  };

  const handleRemoveFilter = (key: string) => {
    const setter = filterDefs.find((d) => d.key === key)?.set;
    if (setter) setter(defaultValues[key] ?? 'any');
  };

  // 处理搜索框回车
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* 第一行：搜索栏 */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallpapers..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-20 h-8 text-sm"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          onClick={onSearch}
          size="sm"
          className="h-8 px-3 text-xs font-medium"
        >
          Search
        </Button>
        <Button
          variant={isFilterOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="h-8 px-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1.5 h-4 px-1 text-[10px]"
            >
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* 第二行：详细筛选选项 */}
      <AnimatePresence mode="wait">
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* 主筛选 - 2列布局 */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={categories} onValueChange={onCategoriesChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sorting} onValueChange={onSortingChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORTING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 次要筛选 */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={purity} onValueChange={onPurityChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {PURITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resolution} onValueChange={onResolutionChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Resolution" />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 最小尺寸 - 全宽 */}
            <div className="grid grid-cols-1">
              <Select value={atleast} onValueChange={onAtleastChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Min size" />
                </SelectTrigger>
                <SelectContent>
                  {ATLEAST_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 活跃筛选标签 */}
      <AnimatePresence mode="popLayout">
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="text-[10px] text-muted-foreground">Active:</span>
            {activeFilters.map((filter) => (
              <FilterBadge
                key={filter.key}
                label={filter.label}
                onRemove={() => handleRemoveFilter(filter.key)}
              />
            ))}
            <button
              onClick={() => {
                onCategoriesChange(defaultValues.cat);
                onPurityChange(defaultValues.pur);
                onSortingChange(defaultValues.sort);
                onResolutionChange(defaultValues.res);
                onAtleastChange(defaultValues.atleast);
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground ml-1"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
