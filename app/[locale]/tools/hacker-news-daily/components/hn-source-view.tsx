'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LegoButton } from '@/components/ui/lego-button';
import { CopyButton } from '@/components/copy-button';
import { LoadingPlaceholder } from '@/components/loading-placeholder';
import { Empty } from '@/components/ui/empty';
import { CheckIcon, FireIcon, ClockIcon, ChartBarIcon, BookmarkIcon, GlobeIcon } from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import { useHNFavorites } from '@/lib/hooks/use-hn-favorites';
import { HNCollectionDialog } from './hn-collection-dialog';
import { formatTime } from './hacker-news-daily-client';
import type { HNFavoriteItem } from '@/lib/storage/hn-types';

// 新闻项类型
interface NewsItem {
  id: number;
  title: string;
  url: string;
  domain: string;
  score: number;
  by: string;
  time: number;
  summary: string;
  hotScore?: number;
}

// API 响应类型
interface HNApiResponse {
  items: NewsItem[];
  source: string;
  generatedAt: string;
  cachedAt?: string;
  fromCache?: boolean;
}

// 排序类型
type SortType = 'hot' | 'newest' | 'score';

// 计算热度分
function calculateHotScore(item: NewsItem): number {
  const hoursSincePosted = (Date.now() / 1000 - item.time) / 3600;
  const gravity = 1.8;
  const decay = Math.pow(hoursSincePosted + 2, gravity);
  return Math.round((item.score / decay) * 100);
}

interface HNSourceViewProps {
  source: 'topstories' | 'newstories' | 'beststories';
}

export function HNSourceView({ source }: HNSourceViewProps) {
  const t = useTranslations('HackerNewsDaily');

  // 收藏相关
  const { collections, toggleFavorite, createCollection, getCollectionsContainingNews, isInCollection } = useHNFavorites();

  // 内部状态
  const [sortBy, setSortBy] = React.useState<SortType>('hot');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<HNApiResponse | null>(null);
  const [favoritedNewsIds, setFavoritedNewsIds] = React.useState<Set<number>>(new Set());

  // 收藏弹窗状态
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedNews, setSelectedNews] = React.useState<NewsItem | null>(null);

  // 获取数据
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hacker-news-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, limit: 30 }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '请求失败');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [source]);

  // 检查收藏状态 - 当数据加载完成后执行
  React.useEffect(() => {
    if (!data?.items) return;

    let ignore = false;
    const checkFavorites = async () => {
      const allFavorited = new Set<number>();

      for (const item of data.items) {
        const collections = await getCollectionsContainingNews(item.id);
        if (collections.length > 0 && !ignore) {
          allFavorited.add(item.id);
        }
      }

      if (!ignore) {
        setFavoritedNewsIds(allFavorited);
      }
    };

    checkFavorites();

    return () => {
      ignore = true;
    };
  }, [data, getCollectionsContainingNews]);

  // 排序后的数据
  const sortedItems = React.useMemo(() => {
    if (!data?.items) return [];

    const itemsWithHotScore = data.items.map((item) => ({
      ...item,
      hotScore: calculateHotScore(item),
    }));

    switch (sortBy) {
      case 'hot':
        return [...itemsWithHotScore].sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0));
      case 'newest':
        return [...itemsWithHotScore].sort((a, b) => b.time - a.time);
      case 'score':
        return [...itemsWithHotScore].sort((a, b) => b.score - a.score);
      default:
        return itemsWithHotScore;
    }
  }, [data, sortBy]);

  // 打开收藏弹窗
  const handleOpenFavorite = (item: NewsItem) => {
    setSelectedNews(item);
    setDialogOpen(true);
  };

  // 选择收藏夹
  const handleSelectCollection = async (collectionId: string) => {
    if (!selectedNews) return;
    await toggleFavorite(collectionId, selectedNews);

    // 更新收藏状态
    const updatedIds = new Set(favoritedNewsIds);
    if (updatedIds.has(selectedNews.id)) {
      updatedIds.delete(selectedNews.id);
    } else {
      updatedIds.add(selectedNews.id);
    }
    setFavoritedNewsIds(updatedIds);
  };

  // 创建收藏夹并添加
  const handleCreateCollection = async (name: string) => {
    const collection = await createCollection(name);
    await handleSelectCollection(collection.id);
  };

  // 检查新闻是否已收藏
  const isFavorited = (newsId: number) => favoritedNewsIds.has(newsId);

  return (
    <div className="space-y-6">
      {/* 排序切换和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 排序切换 */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setSortBy('hot')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sortBy === 'hot' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FireIcon className="h-3.5 w-3.5" />
              {t('sortHot')}
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sortBy === 'newest' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              {t('sortNewest')}
            </button>
            <button
              onClick={() => setSortBy('score')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sortBy === 'score' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ChartBarIcon className="h-3.5 w-3.5" />
              {t('sortScore')}
            </button>
          </div>
        </div>

        <LegoButton
          onClick={fetchData}
          disabled={loading}
          color={loading ? 'white' : 'black'}
          className="rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('loading')}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              {t('refresh')}
            </>
          )}
        </LegoButton>
      </div>

      {/* 加载状态 */}
      {loading && !data && (
        <LoadingPlaceholder
          message={t('loadingMessage')}
          icon={<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
        />
      )}

      {/* 错误显示 */}
      {error && !loading && (
        <Card className="rounded-xl border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <LegoButton onClick={fetchData} color="white" size="sm" className="rounded-lg">
              {t('retry')}
            </LegoButton>
          </CardContent>
        </Card>
      )}

      {/* 空状态 - 未加载数据 */}
      {!data && !loading && !error && (
        <Empty
          icon={BookmarkIcon}
          title={t('noResults')}
          description={t('loadingMessage')}
          action={{
            label: t('refresh'),
            onClick: fetchData,
          }}
        />
      )}

      {/* 结果列表 */}
      {data && !loading && !error && (
        <div className="space-y-4">
          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('resultCount', { count: sortedItems.length })}</span>
            {data.fromCache && (
              <Badge variant="secondary" className="text-xs">{t('cached')}</Badge>
            )}
          </div>

          {/* 新闻卡片列表 */}
          <div className="grid gap-4">
            {sortedItems.slice(0, 20).map((item: NewsItem & { hotScore?: number }) => {
              const favorited = isFavorited(item.id);
              return (
                <Card key={item.id} className="rounded-xl hover:ring-1 transition-all">
                  <CardContent className="p-4 space-y-3">
                    {/* 标题和链接 */}
                    <div className="flex items-start justify-between gap-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium hover:text-primary transition-colors line-clamp-2 flex-1"
                      >
                        {item.title}
                      </a>
                      <div className="flex items-center gap-1 shrink-0">
                        <LegoButton
                          size="sm"
                          color="white"
                          onClick={() => handleOpenFavorite(item)}
                          className={favorited ? 'text-yellow-500' : ''}
                        >
                          <BookmarkIcon className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                        </LegoButton>
                        <CopyButton value={item.url} variant="ghost" size="icon-xs" />
                      </div>
                    </div>

                    {/* 摘要 */}
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GlobeIcon className="h-3 w-3" />
                        {item.domain}
                      </span>
                      <span>{formatTime(item.time)}</span>
                      <span className="flex items-center gap-1">
                        <FireIcon className="h-3 w-3 text-orange-500" />
                        {item.hotScore}
                      </span>
                      <span>{item.score} {t('points')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 空数据状态 */}
          {data.items.length === 0 && (
            <Card className="rounded-xl">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('noResults')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 收藏夹选择弹窗 */}
      <HNCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collections={collections}
        news={selectedNews ? {
          id: selectedNews.id,
          title: selectedNews.title,
          url: selectedNews.url,
          domain: selectedNews.domain,
          score: selectedNews.score,
          by: selectedNews.by,
          time: selectedNews.time,
          summary: selectedNews.summary,
        } : null}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={handleCreateCollection}
        isNewsInCollection={async (collectionId) => selectedNews ? await isInCollection(collectionId, selectedNews.id) : false}
      />
    </div>
  );
}
