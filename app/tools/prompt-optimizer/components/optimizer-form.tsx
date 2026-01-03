'use client';

/**
 * 优化表单组件
 * 接收用户输入的原始提示词
 */

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, SpinnerIcon } from '@phosphor-icons/react';
import { ModelSelectorTrigger } from './model-selector';

interface OptimizerFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isOptimizing: boolean;
  disabled?: boolean;
  className?: string;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
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
}: OptimizerFormProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

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

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'relative rounded-md border bg-background transition-colors',
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
          placeholder="输入你想要优化的提示词..."
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
                {value.length} 字符 • {value.split(/\s+/).filter(Boolean).length} 词
              </>
            )}
          </span>

          {/* 右侧：模型选择器 + 提交按钮 */}
          <div className="flex items-center gap-2">
            <ModelSelectorTrigger
              value={selectedModel}
              onValueChange={(value) => value && onModelChange(value)}
              disabled={disabled || isOptimizing}
            />
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
