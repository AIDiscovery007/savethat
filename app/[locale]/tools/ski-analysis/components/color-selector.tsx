'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaletteIcon } from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface ColorSelectorProps {
  jacketColor: string;
  pantsColor: string;
  helmetColor: string;
  onJacketColorChange: (color: string) => void;
  onPantsColorChange: (color: string) => void;
  onHelmetColorChange: (color: string) => void;
  disabled?: boolean;
}

const COMMON_COLORS = [
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Green', value: 'green', hex: '#10B981' },
  { name: 'Yellow', value: 'yellow', hex: '#FBBF24' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Purple', value: 'purple', hex: '#A855F7' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
];

export function ColorSelector({
  jacketColor,
  pantsColor,
  helmetColor,
  onJacketColorChange,
  onPantsColorChange,
  onHelmetColorChange,
  disabled,
}: ColorSelectorProps) {
  const t = useTranslations('SkiAnalysis');

  const isCustomColor = (currentColor: string) => {
    return currentColor && !COMMON_COLORS.find(c => c.value === currentColor);
  };

  return (
    <Card className="rounded-[var(--radius)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PaletteIcon className="h-5 w-5 text-primary" />
          {t('colorSettings')}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-normal">
          {t('colorSettingsDesc')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 雪服颜色 */}
        <div className="space-y-2">
          <Label htmlFor="jacket-color" className="text-sm">
            {t('jacketColor')}
          </Label>
          <div className="flex gap-2">
            <div className="flex gap-1 flex-wrap flex-1">
              {COMMON_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onJacketColorChange(color.value)}
                  className={clsx(
                    'w-8 h-8 rounded border-2 transition-all',
                    jacketColor === color.value
                      ? 'border-primary scale-110'
                      : 'border-border hover:border-primary/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <Input
              id="jacket-color"
              type="text"
              placeholder={t('customColor')}
              value={isCustomColor(jacketColor) ? jacketColor : ''}
              onChange={(e) => onJacketColorChange(e.target.value)}
              disabled={disabled}
              className="w-24 text-sm"
            />
          </div>
        </div>

        {/* 雪裤颜色 */}
        <div className="space-y-2">
          <Label htmlFor="pants-color" className="text-sm">
            {t('pantsColor')}
          </Label>
          <div className="flex gap-2">
            <div className="flex gap-1 flex-wrap flex-1">
              {COMMON_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPantsColorChange(color.value)}
                  className={clsx(
                    'w-8 h-8 rounded border-2 transition-all',
                    pantsColor === color.value
                      ? 'border-primary scale-110'
                      : 'border-border hover:border-primary/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <Input
              id="pants-color"
              type="text"
              placeholder={t('customColor')}
              value={isCustomColor(pantsColor) ? pantsColor : ''}
              onChange={(e) => onPantsColorChange(e.target.value)}
              disabled={disabled}
              className="w-24 text-sm"
            />
          </div>
        </div>

        {/* 头盔颜色 */}
        <div className="space-y-2">
          <Label htmlFor="helmet-color" className="text-sm">
            {t('helmetColor')}
          </Label>
          <div className="flex gap-2">
            <div className="flex gap-1 flex-wrap flex-1">
              {COMMON_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onHelmetColorChange(color.value)}
                  className={clsx(
                    'w-8 h-8 rounded border-2 transition-all',
                    helmetColor === color.value
                      ? 'border-primary scale-110'
                      : 'border-border hover:border-primary/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            <Input
              id="helmet-color"
              type="text"
              placeholder={t('customColor')}
              value={isCustomColor(helmetColor) ? helmetColor : ''}
              onChange={(e) => onHelmetColorChange(e.target.value)}
              disabled={disabled}
              className="w-24 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

