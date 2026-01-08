'use client';

import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  { value: '100', label: 'SFW Only' },
  { value: '110', label: 'SFW + Sketchy' },
  { value: '111', label: 'All (NSFW)' },
];

// 排序选项
const SORTING_OPTIONS = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'random', label: 'Random' },
  { value: 'views', label: 'Views' },
  { value: 'toplist', label: 'Top List' },
];

// 精确尺寸选项
const RESOLUTION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '1920x1080', label: '1920x1080 (Full HD)' },
  { value: '2560x1440', label: '2560x1440 (2K)' },
  { value: '3840x2160', label: '3840x2160 (4K)' },
  { value: '5120x2880', label: '5120x2880 (5K)' },
];

// 最小尺寸选项
const ATLEAST_OPTIONS = [
  { value: 'any', label: 'No minimum' },
  { value: '1920x1080', label: '1920x1080+' },
  { value: '2560x1440', label: '2560x1440+' },
  { value: '3840x2160', label: '3840x2160+' },
];

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
  const [isOpen, setIsOpen] = React.useState(false);

  // 处理搜索框回车
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={cn('space-y-4 w-full', className)}>
      {/* 顶部搜索栏 */}
      <div className="flex gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallpapers..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={onSearch}>
          Search
        </Button>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* 筛选面板 - 独立一行，与搜索栏分离 */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="space-y-4 pt-4 w-full">
          {/* 筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 分类 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categories} onValueChange={onCategoriesChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 纯度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Rating</label>
              <Select value={purity} onValueChange={onPurityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purity" />
                </SelectTrigger>
                <SelectContent>
                  {PURITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sorting} onValueChange={onSortingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sorting" />
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

            {/* 尺寸 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution</label>
              <Select value={resolution} onValueChange={onResolutionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Exact size" />
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
          </div>

          {/* 最小尺寸 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Size</label>
              <Select value={atleast} onValueChange={onAtleastChange}>
                <SelectTrigger>
                  <SelectValue placeholder="No minimum" />
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
          </div>

          {/* 当前筛选状态 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <Badge variant="secondary">
              {CATEGORIES_OPTIONS.find((o) => o.value === categories)?.label || categories}
            </Badge>
            <Badge variant="secondary">
              {PURITY_OPTIONS.find((o) => o.value === purity)?.label || purity}
            </Badge>
            <Badge variant="secondary">
              {SORTING_OPTIONS.find((o) => o.value === sorting)?.label || sorting}
            </Badge>
            {resolution && resolution !== 'any' && (
              <Badge variant="secondary">
                {RESOLUTION_OPTIONS.find((o) => o.value === resolution)?.label || resolution}
              </Badge>
            )}
            {atleast && atleast !== 'any' && (
              <Badge variant="secondary">
                {ATLEAST_OPTIONS.find((o) => o.value === atleast)?.label || atleast}
              </Badge>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
