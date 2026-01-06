'use client';

/**
 * 风格选择组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CoverStyle } from '../page';
import {
  SparkleIcon,
  PaletteIcon,
  SunIcon,
  SnowflakeIcon,
  ConfettiIcon,
} from '@phosphor-icons/react';

interface StyleOptionsProps {
  selectedStyle: CoverStyle;
  onStyleChange: (style: CoverStyle) => void;
  disabled?: boolean;
}

const STYLE_OPTIONS: Array<{
  id: CoverStyle;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}> = [
  {
    id: 'vibrant',
    label: '鲜艳风格',
    description: '色彩饱和度高，视觉冲击力强',
    icon: SparkleIcon,
    colorClass: 'bg-gradient-to-r from-orange-400 to-pink-500',
  },
  {
    id: 'minimal',
    label: '极简风格',
    description: '简约干净，留白艺术',
    icon: PaletteIcon,
    colorClass: 'bg-gradient-to-r from-gray-400 to-gray-600',
  },
  {
    id: 'warm',
    label: '暖色风格',
    description: '温暖柔和，温馨氛围',
    icon: SunIcon,
    colorClass: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
  {
    id: 'cool',
    label: '冷色风格',
    description: '清爽冷静，专业感',
    icon: SnowflakeIcon,
    colorClass: 'bg-gradient-to-r from-cyan-400 to-blue-500',
  },
  {
    id: 'playful',
    label: '活泼风格',
    description: '有趣生动，年轻活力',
    icon: ConfettiIcon,
    colorClass: 'bg-gradient-to-r from-purple-400 to-pink-400',
  },
];

export function StyleOptions({
  selectedStyle,
  onStyleChange,
  disabled = false,
}: StyleOptionsProps) {
  const t = useTranslations('CoverGenerator');

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {STYLE_OPTIONS.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleChange(style.id)}
              disabled={disabled}
              className={cn(
                'relative p-3 rounded-lg border text-left transition-all',
                'hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'p-1.5 rounded-md',
                    isSelected ? style.colorClass : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{style.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {style.description}
                  </p>
                </div>
              </div>

              {/* 选中指示器 */}
              {isSelected && (
                <div
                  className={cn(
                    'absolute -top-1 -right-1 w-4 h-4 rounded-full',
                    'flex items-center justify-center',
                    style.colorClass
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
