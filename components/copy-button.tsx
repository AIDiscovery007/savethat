'use client';

/**
 * 复制按钮组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';

interface CopyButtonProps {
  value: string;
  className?: string;
  variant?: 'ghost' | 'outline' | 'secondary' | 'default';
  size?: 'icon-xs' | 'icon-sm' | 'icon' | 'icon-lg' | 'xs' | 'sm' | 'default' | 'lg';
}

export function CopyButton({
  value,
  className,
  variant = 'ghost',
  size = 'icon-xs',
}: CopyButtonProps) {
  const t = useTranslations('CopyButton');
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onCopy}
      className={cn('h-6 w-6', className)}
      title={copied ? t('copied') : t('copy')}
    >
      {copied ? (
        <CheckIcon className="h-3 w-3 text-green-500" />
      ) : (
        <CopyIcon className="h-3 w-3" />
      )}
    </Button>
  );
}
