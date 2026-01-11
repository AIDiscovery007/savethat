'use client';

import { useTranslations } from 'next-intl';
import { WebTranslatorClient } from './components/web-translator-client';
import { GlobeIcon } from '@phosphor-icons/react';

export default function WebTranslatorPage() {
  const t = useTranslations('WebTranslator');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GlobeIcon className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* 主要内容 */}
      <WebTranslatorClient />
    </div>
  );
}
