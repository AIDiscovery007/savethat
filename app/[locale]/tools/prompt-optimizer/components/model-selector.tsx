'use client';

/**
 * 模型选择器组件
 * 使用 Combobox 组件选择 AI 模型
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AVAILABLE_MODELS, getModelsGroupedByProvider, type ModelInfo } from '@/lib/api/aihubmix/models';
import { cn } from '@/lib/utils';
import { CaretDownIcon } from '@phosphor-icons/react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 模型选择器组件 - 完整输入框版本
 */
export function ModelSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const t = useTranslations('ModelSelector');
  const modelsByProvider = React.useMemo(() => getModelsGroupedByProvider(), []);
  const selectedModel = React.useMemo(
    () => AVAILABLE_MODELS.find(m => m.id === value),
    [value]
  );

  return (
    <Combobox value={value} onValueChange={onValueChange} disabled={disabled}>
      <ComboboxInput
        placeholder={t('placeholder')}
        showClear={true}
        className={cn('w-full', className)}
      />
      <ComboboxContent className="w-[--anchor-width] min-w-[300px]">
        <ComboboxList>
          <ComboboxEmpty>{t('noMatch')}</ComboboxEmpty>
          {Object.entries(modelsByProvider).map(([provider, models]) => (
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
 * 模型选择触发器组件 - 简化版本，用于内联布局
 */
interface ModelSelectorTriggerProps {
  value: string;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelectorTrigger({
  value,
  onValueChange,
  disabled = false,
  className,
}: ModelSelectorTriggerProps) {
  const t = useTranslations('ModelSelector');
  const modelsByProvider = React.useMemo(() => getModelsGroupedByProvider(), []);
  const selectedModel = React.useMemo(
    () => AVAILABLE_MODELS.find(m => m.id === value),
    [value]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md',
            'text-sm font-medium text-foreground',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            className
          )}
        >
          <span>{selectedModel?.name || t('placeholder')}</span>
          <CaretDownIcon className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[280px]"
      >
        {Object.entries(modelsByProvider).map(([provider, models], index) => (
          <React.Fragment key={provider}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', getProviderColor(provider))} />
              {provider}
            </DropdownMenuLabel>
            {models.map(model => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => onValueChange(model.id)}
                className={cn(
                  'flex flex-col items-start gap-1 py-2 cursor-pointer',
                  value === model.id && 'bg-accent'
                )}
              >
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {model.description}
                </span>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
