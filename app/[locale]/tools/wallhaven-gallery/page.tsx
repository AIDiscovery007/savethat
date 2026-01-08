'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchFilters } from '@/components/wallpaper/search-filters';
import { WallpaperGrid } from '@/components/wallpaper/wallpaper-grid';
import type { WallhavenWallpaper } from '@/lib/api/wallhaven/types';

// API 基础 URL
const API_BASE = '/api/wallhaven';

export default function WallhavenGalleryPage() {
  const t = useTranslations('WallhavenGallery');

  // 搜索状态
  const [query, setQuery] = React.useState('');
  const [categories, setCategories] = React.useState('110');
  const [purity, setPurity] = React.useState('100');
  const [sorting, setSorting] = React.useState('date_added');
  const [resolution, setResolution] = React.useState('any');
  const [atleast, setAtleast] = React.useState('any');

  // 数据状态
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

      // 添加尺寸筛选参数
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

  // 初始加载和筛选变化时搜索
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

  // 单张下载 - 代理下载强制浏览器保存
  const handleDownload = async (wallpaper: WallhavenWallpaper) => {
    try {
      const downloadUrl = `/api/wallhaven/wallpaper/${wallpaper.id}/download`;
      const ext = wallpaper.file_type.split('/')[1] ?? 'jpg';
      const filename = `wallhaven-${wallpaper.id}.${ext}`;

      // 创建隐藏的 a 标签触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_self'; // 在当前窗口触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download wallpaper');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

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
