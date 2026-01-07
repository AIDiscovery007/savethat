'use client';

/**
 * 风格选择组件
 * 创意趣味风格设计
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { COVER_STYLES } from '../config/styles';
import { motion } from 'framer-motion';

interface StyleOptionsProps {
  selectedStyleId: string;
  onStyleChange: (styleId: string) => void;
  disabled?: boolean;
}

export function StyleOptions({
  selectedStyleId,
  onStyleChange,
  disabled = false,
}: StyleOptionsProps) {
  const t = useTranslations('CoverGenerator');

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {COVER_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyleId === style.id;

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
                {/* 颜色预览点 */}
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${style.colors.primary} 0%, ${style.colors.secondary} 50%, ${style.colors.accent} 100%)`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{style.name}</p>
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
                    'bg-primary'
                  )}
                  style={{
                    background: style.colors.accent,
                  }}
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
