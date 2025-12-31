'use client';

/**
 * 模型选择器组件
 * 使用 Combobox 组件选择 AI 模型
 */

import * as React from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { AVAILABLE_MODELS, getModelsGroupedByProvider, type ModelInfo } from '@/lib/api/aihubmix/models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 模型选择器组件
 */
export function ModelSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const modelsByProvider = React.useMemo(() => getModelsGroupedByProvider(), []);
  const selectedModel = React.useMemo(
    () => AVAILABLE_MODELS.find(m => m.id === value),
    [value]
  );

  // 搜索过滤
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredProviders = React.useMemo(() => {
    if (!searchQuery) return modelsByProvider;

    const filtered: Record<string, ModelInfo[]> = {};
    for (const [provider, models] of Object.entries(modelsByProvider)) {
      const matching = models.filter(
        m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matching.length > 0) {
        filtered[provider] = matching;
      }
    }
    return filtered;
  }, [modelsByProvider, searchQuery]);

  return (
    <Combobox value={value} onValueChange={onValueChange} disabled={disabled}>
      <ComboboxInput
        placeholder="选择模型..."
        showClear={true}
        className={cn('w-full', className)}
        onValueChange={(value) => setSearchQuery(value)}
      />
      <ComboboxContent className="w-[--anchor-width] min-w-[300px]">
        <ComboboxList>
          <ComboboxEmpty>没有找到匹配的模型</ComboboxEmpty>
          {Object.entries(filteredProviders).map(([provider, models]) => (
            <ComboboxGroup key={provider}>
              <ComboboxLabel>{provider}</ComboboxLabel>
              {models.map(model => (
                <ComboboxItem key={model.id} value={model.id}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {model.description}
                    </span>
                  </div>
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * 获取模型显示名称
 */
export function getModelDisplayName(modelId: string): string {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.name || modelId;
}

/**
 * 获取模型提供商图标颜色
 */
export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    Google: 'bg-blue-500',
    OpenAI: 'bg-emerald-500',
    Anthropic: 'bg-orange-500',
    DeepSeek: 'bg-cyan-500',
    Perplexity: 'bg-indigo-500',
  };
  return colors[provider] || 'bg-gray-500';
}
