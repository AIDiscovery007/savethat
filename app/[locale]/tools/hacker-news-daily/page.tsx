'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { NewspaperIcon, BookmarkIcon } from '@phosphor-icons/react';
import { TabsRoot, TabsList, TabsTab } from '@/components/ui/tabs';
import { HackerNewsDailyClient } from './components/hacker-news-daily-client';
import { HNFavoritesView } from './components/hn-favorites-view';

type ViewType = 'news' | 'favorites';

export default function HackerNewsDailyPage() {
  const t = useTranslations('HackerNewsDaily');
  const [view, setView] = React.useState<ViewType>('news');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <NewspaperIcon className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* 视图切换 */}
      <TabsRoot value={view} onValueChange={(v) => setView(v as ViewType)}>
        <TabsList>
          <TabsTab value="news">
            <NewspaperIcon className="h-4 w-4 mr-2" />
            {t('viewNews')}
          </TabsTab>
          <TabsTab value="favorites">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            {t('viewFavorites')}
          </TabsTab>
        </TabsList>
      </TabsRoot>

      {/* 主要内容 */}
      {view === 'news' ? <HackerNewsDailyClient /> : <HNFavoritesView />}
    </div>
  );
}
