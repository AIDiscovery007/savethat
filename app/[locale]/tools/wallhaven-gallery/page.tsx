'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Grid3X3, Heart, Plus, Edit2, Trash2, FolderHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegoButton } from '@/components/ui/lego-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { SearchFilters } from '@/components/wallpaper/search-filters';
import { WallpaperGrid } from '@/components/wallpaper/wallpaper-grid';
import { WallpaperEmptyState } from '@/components/wallpaper/empty-state';
import { ToastProvider, useWallpaperToasts } from '@/components/wallpaper/toast';
import { useWallpaperFavorites } from '@/lib/hooks/use-wallpaper-favorites';
import { wallpaperStorage } from '@/lib/storage/wallpaper-storage';
import type { WallhavenWallpaper, WallpaperCollection } from '@/lib/storage/wallpaper-types';
import { cn } from '@/lib/utils';

// API 基础 URL
const API_BASE = '/api/wallhaven';

// Shared download function to eliminate duplication
function createDownloadHandler(showError: (msg: string) => void) {
  return async (wallpaper: WallhavenWallpaper) => {
    try {
      const downloadUrl = `/api/wallhaven/wallpaper/${wallpaper.id}/download`;
      const ext = wallpaper.file_type.split('/')[1] ?? 'jpg';
      const filename = `wallhaven-${wallpaper.id}.${ext}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      showError('Failed to download wallpaper');
    }
  };
}

function CollectionSwitch({
  collections,
  selectedCollection,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  collections: WallpaperCollection[];
  selectedCollection: WallpaperCollection | null;
  onSelect: (collection: WallpaperCollection | null) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const tc = useTranslations('WallpaperCollection');
  const [newName, setNewName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { showCreated, showDeleted } = useWallpaperToasts();

  // Use selectedCollection.id directly as local state
  const [localId, setLocalId] = React.useState(selectedCollection?.id ?? '');

  // Keep localId in sync when selectedCollection changes
  React.useEffect(() => {
    if (selectedCollection?.id) {
      setLocalId(selectedCollection.id);
    }
  }, [selectedCollection?.id]);

  const handleCreate = async () => {
    if (newName.trim()) {
      await onCreate();
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (newName.trim() && localId) {
      await onRename();
      setNewName('');
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete();
    setIsDeleting(false);
    setLocalId('');
    onSelect(null);
  };

  const handleSelectChange = React.useCallback((value: string) => {
    setLocalId(value);
    if (value === '') {
      onSelect(null);
    } else {
      const collection = collections.find((c) => c.id === value);
      onSelect(collection || null);
    }
  }, [collections, onSelect]);

  return (
    <Card className="rounded-xl">
      <CardContent className="py-3">
        <div className="flex items-center gap-2">
          {/* 收藏夹选择器 */}
          <div className="flex-1 min-w-0">
            <Select
              value={localId}
              onValueChange={handleSelectChange}
              disabled={isCreating || isEditing}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={tc('noCollectionsYet')} />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 新建按钮 */}
          <LegoButton
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setNewName('');
            }}
            className="h-9 gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{tc('create')}</span>
          </LegoButton>

          {/* 操作按钮 */}
          {localId && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  const collection = collections.find((c) => c.id === localId);
                  setNewName(collection?.name || '');
                }}
                className="h-9 gap-1"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">{tc('rename')}</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsDeleting(true)}
                className="h-9 gap-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* 新建收藏夹输入框 */}
        {isCreating && (
          <div className="flex gap-2 mt-3">
            <Input
              placeholder={tc('newCollectionPlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            <LegoButton size="sm" onClick={handleCreate}>
              {tc('create')}
            </LegoButton>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              {tc('cancel')}
            </Button>
          </div>
        )}

        {/* 重命名输入框 */}
        {isEditing && localId && (
          <div className="flex gap-2 mt-3">
            <Input
              placeholder={tc('newCollectionPlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            <LegoButton size="sm" onClick={handleRename}>
              {tc('rename')}
            </LegoButton>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              {tc('cancel')}
            </Button>
          </div>
        )}
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('deleteCollection')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc('deleteCollectionConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CollectionsView() {
  const tc = useTranslations('WallpaperCollection');
  const { showCreated, showDeleted, showError } = useWallpaperToasts();
  const { collections } = useWallpaperFavorites();
  const handleDownload = createDownloadHandler(showError);

  const [selectedCollection, setSelectedCollection] = React.useState<WallpaperCollection | null>(null);
  const [collectionWallpapers, setCollectionWallpapers] = React.useState<WallhavenWallpaper[]>([]);
  const [loading, setLoading] = React.useState(false);

  // 加载收藏夹壁纸
  const loadCollectionWallpapers = React.useCallback(async () => {
    if (!selectedCollection) {
      setCollectionWallpapers([]);
      return;
    }

    setLoading(true);
    try {
      const favorites = await wallpaperStorage.getFavoritesByCollection(selectedCollection.id);
      setCollectionWallpapers(favorites.map((f) => f.wallpaper));
    } catch (error) {
      console.error('Failed to load collection wallpapers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCollection]);

  React.useEffect(() => {
    loadCollectionWallpapers();
  }, [loadCollectionWallpapers]);

  // 创建收藏夹
  const handleCreateCollection = async () => {
    const name = prompt(tc('newCollectionPlaceholder'));
    if (name && name.trim()) {
      try {
        const collection = await wallpaperStorage.createCollection(name.trim());
        setSelectedCollection(collection);
        showCreated(collection.name);
      } catch (error) {
        showError('Failed to create collection');
      }
    }
  };

  // 重命名收藏夹
  const handleRenameCollection = async () => {
    if (!selectedCollection) return;
    const name = prompt(tc('newCollectionPlaceholder'), selectedCollection.name);
    if (name && name.trim() && name !== selectedCollection.name) {
      try {
        await wallpaperStorage.updateCollection(selectedCollection.id, { name: name.trim() });
        setSelectedCollection((prev) => prev ? { ...prev, name: name.trim() } : null);
      } catch (error) {
        showError('Failed to rename collection');
      }
    }
  };

  // 删除收藏夹
  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    try {
      await wallpaperStorage.deleteCollection(selectedCollection.id);
      showDeleted();
    } catch (error) {
      showError('Failed to delete collection');
    }
  };

  // 从收藏夹移除壁纸
  const handleRemoveFromCollection = async (wallpaperId: string) => {
    if (!selectedCollection) return;
    try {
      await wallpaperStorage.removeFromCollectionByWallpaperId(selectedCollection.id, wallpaperId);
      setCollectionWallpapers((prev) => prev.filter((w) => w.id !== wallpaperId));
    } catch (error) {
      showError('Failed to remove wallpaper');
    }
  };

  return (
    <div className="space-y-6">
      {/* 收藏夹选择器 */}
      <CollectionSwitch
        collections={collections}
        selectedCollection={selectedCollection}
        onSelect={setSelectedCollection}
        onCreate={handleCreateCollection}
        onRename={handleRenameCollection}
        onDelete={handleDeleteCollection}
      />

      {/* 收藏夹内容 */}
      {selectedCollection ? (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderHeart className="h-4 w-4" />
              {selectedCollection.name}
            </CardTitle>
            {selectedCollection.description && (
              <CardDescription>{selectedCollection.description}</CardDescription>
            )}
            <p className="text-sm text-muted-foreground">
              {tc('itemCount', { count: collectionWallpapers.length })}
            </p>
          </CardHeader>
          <CardContent>
            {collectionWallpapers.length > 0 ? (
              <WallpaperGrid
                wallpapers={collectionWallpapers}
                loading={loading}
                page={1}
                totalPages={1}
                onPageChange={() => {}}
                onDownload={handleDownload}
                onRemove={(wallpaper) => handleRemoveFromCollection(wallpaper.id)}
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {tc('emptyCollection')}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <WallpaperEmptyState
          variant="collections"
          title={tc('noCollectionsYet')}
          action={{
            label: tc('createNewCollection'),
            onClick: handleCreateCollection,
          }}
          className="py-12"
        />
      )}
    </div>
  );
}

function BrowseView() {
  const t = useTranslations('WallhavenGallery');
  const showError = (msg: string) => alert(msg);
  const handleDownload = createDownloadHandler(showError);
  const [query, setQuery] = React.useState('');
  const [categories, setCategories] = React.useState('110');
  const [purity, setPurity] = React.useState('100');
  const [sorting, setSorting] = React.useState('date_added');
  const [resolution, setResolution] = React.useState('any');
  const [atleast, setAtleast] = React.useState('any');

  const [wallpapers, setWallpapers] = React.useState<WallhavenWallpaper[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  // 搜索壁纸
  const searchWallpapers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        categories,
        purity,
        sorting,
        page: page.toString(),
        limit: '24',
      });

      if (resolution && resolution !== 'any') {
        params.set('resolutions', resolution);
      }
      if (atleast && atleast !== 'any') {
        params.set('atleast', atleast);
      }

      const response = await fetch(`${API_BASE}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      setWallpapers(data.data || []);
      setTotalPages(data.meta?.last_page || 1);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search wallpapers');
    } finally {
      setLoading(false);
    }
  }, [query, categories, purity, sorting, resolution, atleast, page]);

  // 初始加载和分页
  React.useEffect(() => {
    searchWallpapers();
  }, [page]);

  // 处理搜索
  const handleSearch = () => {
    setPage(1);
    searchWallpapers();
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 搜索筛选 */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('filters')}</CardTitle>
          <CardDescription>{t('filtersDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilters
            query={query}
            onQueryChange={setQuery}
            categories={categories}
            onCategoriesChange={setCategories}
            purity={purity}
            onPurityChange={setPurity}
            sorting={sorting}
            onSortingChange={setSorting}
            resolution={resolution}
            onResolutionChange={setResolution}
            atleast={atleast}
            onAtleastChange={setAtleast}
            onSearch={handleSearch}
          />
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="rounded-xl border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 壁纸网格 */}
      <WallpaperGrid
        wallpapers={wallpapers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default function WallhavenGalleryPage() {
  const t = useTranslations('WallhavenGallery');
  const tc = useTranslations('WallpaperCollection');
  const [activeView, setActiveView] = React.useState<'browse' | 'collections'>('browse');

  return (
    <ToastProvider>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg w-fit">
          <button
            onClick={() => setActiveView('browse')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeView === 'browse'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            {t('browse')}
          </button>
          <button
            onClick={() => setActiveView('collections')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeView === 'collections'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className="h-4 w-4" />
            {tc('title')}
          </button>
        </div>

        {/* 视图内容 */}
        {activeView === 'browse' ? <BrowseView /> : <CollectionsView />}
      </div>
    </ToastProvider>
  );
}
