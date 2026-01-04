'use client';

/**
 * 优化表单组件
 * 接收用户输入的原始提示词
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, SpinnerIcon } from '@phosphor-icons/react';
import { ModelSelectorTrigger } from './model-selector';
import { supportsThinkingMode } from '@/lib/api/aihubmix/models';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BrainIcon } from '@phosphor-icons/react';

interface OptimizerFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isOptimizing: boolean;
  disabled?: boolean;
  className?: string;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  thinkingEnabled?: boolean;
  onThinkingChange?: (enabled: boolean) => void;
}

export function OptimizerForm({
  value,
  onChange,
  onSubmit,
  isOptimizing,
  disabled = false,
  className,
  selectedModel,
  onModelChange,
  thinkingEnabled = false,
  onThinkingChange,
}: OptimizerFormProps) {
  const t = useTranslations('OptimizerForm');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // 检查当前模型是否支持 thinking 模式
  const supportsThinking = supportsThinkingMode(selectedModel);
  const showThinkingToggle = supportsThinking && !disabled && !isOptimizing;

  // 自动调整高度
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && !isOptimizing) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (value.trim() && !disabled && !isOptimizing) {
        onSubmit();
      }
    }
  };

  const canSubmit = value.trim() && !disabled && !isOptimizing;
  const wordsCount = value.split(/\s+/).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'relative rounded-[var(--radius)] border bg-background transition-all duration-200',
          isFocused ? 'border-ring ring-1 ring-ring/10' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* 输入框 */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          disabled={disabled}
          className={cn(
            'min-h-[120px] max-h-[300px] resize-none border-0 bg-transparent px-3 pt-3 pb-0',
            'focus-visible:ring-0 focus-visible:outline-none',
            'placeholder:text-muted-foreground'
          )}
        />

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-3 pb-3 pt-2">
          {/* 左侧：字符数统计 */}
          <span className="text-xs text-muted-foreground">
            {value.length > 0 && (
              <>
                {t('charsWords', { chars: value.length, words: wordsCount })}
              </>
            )}
          </span>

          {/* 右侧：模型选择器 + Thinking 开关 + 提交按钮 */}
          <div className="flex items-center gap-2">
            <ModelSelectorTrigger
              value={selectedModel}
              onValueChange={(value) => value && onModelChange(value)}
              disabled={disabled || isOptimizing}
            />
            {/* Thinking 模式开关 - 仅支持 thinking 的模型显示 */}
            {showThinkingToggle && onThinkingChange && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onThinkingChange(!thinkingEnabled)}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                        thinkingEnabled
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <BrainIcon
                        className={cn(
                          'h-4 w-4',
                          thinkingEnabled && 'animate-pulse'
                        )}
                      />
                      <span className="hidden sm:inline">Thinking</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('thinkingModeTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* 提交按钮 - 圆形向上箭头 */}
            <Button
              type="button"
              size="icon"
              disabled={!canSubmit}
              onClick={onSubmit}
              className={cn(
                'h-8 w-8 rounded-full',
                canSubmit
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isOptimizing ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
