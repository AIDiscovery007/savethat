'use client';

/**
 * 技能水平选择器组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Snowflake, Mountain, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface SkillSelectorProps {
  value: 'beginner' | 'intermediate' | 'advanced';
  onChange: (value: 'beginner' | 'intermediate' | 'advanced') => void;
  disabled?: boolean;
}

export function SkillSelector({ value, onChange, disabled }: SkillSelectorProps) {
  const t = useTranslations('SkiAnalysis');

  const options = [
    {
      value: 'beginner' as const,
      icon: Snowflake,
      label: t('skillBeginner'),
      description: t('skillBeginnerDesc'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      value: 'intermediate' as const,
      icon: Mountain,
      label: t('skillIntermediate'),
      description: t('skillIntermediateDesc'),
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      value: 'advanced' as const,
      icon: Zap,
      label: t('skillAdvanced'),
      description: t('skillAdvancedDesc'),
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ] as const;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('selectSkillLevel')}</p>
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
