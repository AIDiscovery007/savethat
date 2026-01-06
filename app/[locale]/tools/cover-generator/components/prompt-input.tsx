'use client';

/**
 * 提示词输入组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export function PromptInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  rows = 4,
  maxLength = 500,
  showCount = true,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // 自动调整高度
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const charCount = value.length;
  const isNearMax = charCount >= maxLength * 0.9;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative rounded-lg border transition-colors',
          isFocused
            ? 'border-primary ring-1 ring-primary'
            : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'min-h-[100px] resize-none border-0 p-3 shadow-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            disabled && 'cursor-not-allowed'
          )}
        />

        {/* 字符计数 */}
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

      {/* 快捷键提示 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Ctrl</kbd>
        <span>+</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd>
        <span>{'提交'}</span>
      </div>
    </div>
  );
}
