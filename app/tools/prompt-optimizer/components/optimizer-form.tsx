'use client';

/**
 * 优化表单组件
 * 接收用户输入的原始提示词
 */

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MagicWandIcon, XIcon } from '@phosphor-icons/react';

interface OptimizerFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isOptimizing: boolean;
  disabled?: boolean;
  className?: string;
}

export function OptimizerForm({
  value,
  onChange,
  onSubmit,
  isOptimizing,
  disabled = false,
  className,
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

  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'relative rounded-none border bg-background transition-colors',
          isFocused ? 'border-ring ring-1 ring-ring/10' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
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
            'min-h-[120px] max-h-[300px] resize-none border-0 bg-transparent p-4',
            'focus-visible:ring-0 focus-visible:outline-none',
            'placeholder:text-muted-foreground'
          )}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-xs text-muted-foreground">
            {value.length > 0 && (
              <>
                {value.length} 字符
                {value.length > 0 && ' • '}
                {value.split(/\s+/).filter(Boolean).length} 词
              </>
            )}
          </span>
          {value.length > 0 && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              className="h-6 w-6"
            >
              <XIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          按 <kbd className="rounded-none bg-muted px-1 py-0.5 text-xs">Ctrl</kbd>
          {' + '}
          <kbd className="rounded-none bg-muted px-1 py-0.5 text-xs">Enter</kbd>
          快速提交
        </span>
        <Button
          type="submit"
          disabled={disabled || !value.trim() || isOptimizing}
          isLoading={isOptimizing}
          className="min-w-[100px]"
        >
          {isOptimizing ? (
            <>优化中...</>
          ) : (
            <>
              <MagicWandIcon className="mr-2 h-4 w-4" />
              开始优化
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
