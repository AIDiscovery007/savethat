'use client';

/**
 * 毒舌程度选择器组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Heart, Flame, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import type { RoastLevel } from '@/lib/prompts/ski-analysis/system-prompts';

interface RoastSelectorProps {
  value: RoastLevel;
  onChange: (value: RoastLevel) => void;
  disabled?: boolean;
}

export function RoastSelector({ value, onChange, disabled }: RoastSelectorProps) {
  const t = useTranslations('SkiAnalysis');

  const options = [
    {
      value: 'mild' as const,
      icon: Heart,
      label: t('roastMild'),
      description: t('roastMildDesc'),
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      value: 'medium' as const,
      icon: Flame,
      label: t('roastMedium'),
      description: t('roastMediumDesc'),
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      value: 'spicy' as const,
      icon: Zap,
      label: t('roastSpicy'),
      description: t('roastSpicyDesc'),
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ] as const;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('selectRoastLevel')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <Card
              key={option.value}
              className={clsx(
                'cursor-pointer transition-all',
                isSelected
                  ? 'ring-2 ring-primary'
                  : 'hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && onChange(option.value)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={clsx('p-2 rounded-full', option.bgColor)}>
                  <Icon className={clsx('h-5 w-5', option.color)} />
                </div>
                <div className="w-full min-w-0 px-1">
                  <p className="font-medium text-sm break-words">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
