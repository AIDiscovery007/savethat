'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { clsx } from 'clsx';

interface OptionSelectorProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    disabled?: boolean;
    colorClass?: string;
    bgClass?: string;
  }>;
  disabled?: boolean;
  className?: string;
  columns?: 2 | 3 | 4;
  label?: string;
}

export function OptionSelector<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  className,
  columns = 3,
  label,
}: OptionSelectorProps<T>) {
  return (
    <div className={cn('space-y-3', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          'grid gap-3',
          columns === 2 && 'sm:grid-cols-2',
          columns === 3 && 'sm:grid-cols-3',
          columns === 4 && 'sm:grid-cols-4'
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <Card
              key={option.value}
              className={cn(
                'cursor-pointer transition-all',
                isSelected && 'ring-2 ring-primary',
                !isSelected && !option.disabled && 'hover:border-primary/50',
                (option.disabled || disabled) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !(option.disabled || disabled) && onChange(option.value)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                {option.icon && (
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      option.bgClass || (isSelected ? 'bg-primary/10' : 'bg-muted')
                    )}
                  >
                    <span className={cn('text-lg', option.colorClass || (isSelected ? 'text-primary' : 'text-muted-foreground'))}>
                      {option.icon}
                    </span>
                  </div>
                )}
                <div className="w-full min-w-0 px-1">
                  <p className="font-medium text-sm break-words">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {option.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
