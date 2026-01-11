'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LegoButton } from '@/components/ui/lego-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlobeIcon, BookmarkIcon, TrashIcon, PencilIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useHNFavorites } from '@/lib/hooks/use-hn-favorites';
import { formatTime } from './hacker-news-daily-client';
import type { HNCollection, HNFavoriteItem } from '@/lib/storage/hn-types';
import { Empty } from '@/components/ui/empty';
import { webTranslationStorage } from '@/lib/storage/web-translation-storage';

export function HNFavoritesView() {
  const t = useTranslations('HackerNewsDaily');
  const tc = useTranslations('HNCollection');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const {
    collections,
    getFavorites,
    createCollection,
    updateCollection,
    deleteCollection,
    removeFromCollection,
    loading,
    loadingFavorites,
  } = useHNFavorites();

  const [selectedCollection, setSelectedCollection] = React.useState<HNCollection | null>(null);
  const [editingCollection, setEditingCollection] = React.useState<HNCollection | null>(null);
  const [editName, setEditName] = React.useState('');

  // 删除确认弹窗状态
  const [deleteCollectionId, setDeleteCollectionId] = React.useState<string | null>(null);
  const [removeFavoriteItem, setRemoveFavoriteItem] = React.useState<{ id: string; collectionId: string } | null>(null);
  const [translatedUrls, setTranslatedUrls] = React.useState<Set<string>>(new Set());

  // 检查 URL 是否已翻译
  React.useEffect(() => {
    const checkTranslatedUrls = async () => {
      const translated = new Set<string>();
      // 只检查当前选中的收藏夹
      if (selectedCollection) {
        const favorites = getFavorites(selectedCollection.id);
        for (const item of favorites) {
          const isTranslated = await webTranslationStorage.isUrlTranslated(item.news.url);
          if (isTranslated) {
            translated.add(item.news.url);
          }
        }
      }
      setTranslatedUrls(translated);
    };

    checkTranslatedUrls();
  }, [selectedCollection, getFavorites]);

  // 选中的收藏夹
  const selectedFavorites = selectedCollection ? getFavorites(selectedCollection.id) : [];

  // 创建收藏夹（通过 prompt）
  const handleCreateCollection = async () => {
    const name = prompt(tc('newCollectionPlaceholder'));
    if (name && name.trim()) {
      await createCollection(name.trim());
    }
  };

  // 开始编辑收藏夹
  const handleStartEdit = (collection: HNCollection) => {
    setEditingCollection(collection);
    setEditName(collection.name);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (editingCollection && editName.trim()) {
      await updateCollection(editingCollection.id, { name: editName.trim() });
      setEditingCollection(null);
      setEditName('');
    }
  };

  // 删除收藏夹
  const handleDeleteCollection = async () => {
    if (!deleteCollectionId) return;
    await deleteCollection(deleteCollectionId);
    if (selectedCollection?.id === deleteCollectionId) {
      setSelectedCollection(null);
    }
    setDeleteCollectionId(null);
  };

  // 从收藏夹移除
  const handleRemoveFavorite = async () => {
    if (!removeFavoriteItem) return;
    await removeFromCollection(removeFavoriteItem.id, removeFavoriteItem.collectionId);
    setRemoveFavoriteItem(null);
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 收藏夹列表 */}
      <div className="grid gap-4">
        {/* 收藏夹卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((collection) => {
            const favorites = getFavorites(collection.id);
            const isSelected = selectedCollection?.id === collection.id;

            return (
              <Card
                key={collection.id}
                className={`rounded-xl cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : 'hover:ring-1'
                }`}
              >
                <CardContent className="p-4">
                  {editingCollection?.id === collection.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <LegoButton size="sm" onClick={handleSaveEdit}>
                        {tc('create')}
                      </LegoButton>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCollection(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => setSelectedCollection(isSelected ? null : collection)}
                          className="text-left flex-1"
                        >
                          <p className="font-medium truncate">{collection.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {favorites.length} {tc('items')}
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(collection);
                            }}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCollectionId(collection.id);
                            }}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {collections.length === 0 && (
          <Empty
            icon={BookmarkIcon}
            title={tc('emptyCollections')}
            action={{
              label: tc('createNewCollection'),
              onClick: handleCreateCollection,
            }}
          />
        )}
      </div>

      {/* 收藏夹内容 */}
      {selectedCollection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{selectedCollection.name}</h3>
            <Badge variant="secondary">{selectedFavorites.length} {tc('items')}</Badge>
          </div>

          {loadingFavorites ? (
            // 加载状态
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : selectedFavorites.length === 0 ? (
            <Empty
              icon={BookmarkIcon}
              title={tc('emptyCollection')}
            />
          ) : (
            <div className="grid gap-4">
              {selectedFavorites.map((item: HNFavoriteItem) => (
                <Card key={item.id} className="rounded-xl hover:ring-1 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <a
                        href={item.news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium hover:text-primary transition-colors line-clamp-2 flex-1"
                      >
                        {item.news.title}
                      </a>
                      <LegoButton
                        size="sm"
                        color={translatedUrls.has(item.news.url) ? 'blue' : 'white'}
                        onClick={() => window.open(`/${locale}/tools/web-translator?url=${encodeURIComponent(item.news.url)}`, '_blank')}
                        title={translatedUrls.has(item.news.url) ? t('translated') : t('translateWebpage')}
                        className={translatedUrls.has(item.news.url) ? 'opacity-70' : ''}
                      >
                        {translatedUrls.has(item.news.url) ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <GlobeIcon className="h-4 w-4" />
                        )}
                      </LegoButton>
                      <LegoButton
                        size="sm"
                        color="white"
                        onClick={() => setRemoveFavoriteItem({ id: item.id, collectionId: selectedCollection!.id })}
                        className="shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </LegoButton>
                    </div>

                    {item.news.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.news.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GlobeIcon className="h-3 w-3" />
                        {item.news.domain}
                      </span>
                      <span>{formatTime(item.news.time)}</span>
                      <span>{item.news.score} {t('points')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 删除收藏夹确认弹窗 */}
      <AlertDialog open={!!deleteCollectionId} onOpenChange={(open) => !open && setDeleteCollectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('deleteCollection')}</AlertDialogTitle>
            <AlertDialogDescription>{tc('deleteCollectionConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection}>{tc('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 移除收藏确认弹窗 */}
      <AlertDialog open={!!removeFavoriteItem} onOpenChange={(open) => !open && setRemoveFavoriteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('delete')}</AlertDialogTitle>
            <AlertDialogDescription>{tc('deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFavorite}>{tc('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
