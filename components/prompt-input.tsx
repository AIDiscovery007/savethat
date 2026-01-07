'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  rows?: number;
  showCount?: boolean;
  submitOnCtrlEnter?: boolean;
  autoResize?: boolean; // 控制是否自动调整高度
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  className,
  maxLength = 2000,
  rows = 4,
  showCount = true,
  submitOnCtrlEnter = false,
  autoResize = true,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Auto-resize height
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitOnCtrlEnter && onSubmit && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const charCount = value.length;
  const isNearMax = charCount >= maxLength * 0.9;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative rounded-lg border transition-colors',
          isFocused ? 'border-primary ring-1 ring-primary' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'border-0 p-3 shadow-none resize-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            disabled && 'cursor-not-allowed',
            // 当 autoResize 为 false 时，使用固定高度和滚动
            autoResize === false && 'h-[240px] overflow-y-auto'
          )}
        />

        {showCount && (
          <div
            className={cn(
              'absolute bottom-2 right-3 text-xs transition-colors',
              isNearMax ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {submitOnCtrlEnter && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd>
          <span>提交</span>
        </div>
      )}
    </div>
  );
}
