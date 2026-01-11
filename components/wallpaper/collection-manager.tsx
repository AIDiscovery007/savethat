'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  FolderHeart,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  X,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { WallpaperCollection } from '@/lib/storage/wallpaper-types';
import { wallpaperStorage } from '@/lib/storage/wallpaper-storage';

interface CollectionManagerProps {
  collections: WallpaperCollection[];
  selectedId?: string;
  onSelect?: (collection: WallpaperCollection) => void;
  onCreate?: (name: string, description?: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  className?: string;
}

interface CollectionWithCount extends WallpaperCollection {
  wallpaperCount?: number;
}

export function CollectionManager({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  className,
}: CollectionManagerProps) {
  const t = useTranslations('WallpaperCollection');
  const [newName, setNewName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // 获取每个收藏夹的壁纸数量
  React.useEffect(() => {
    const fetchCounts = async () => {
      const newCounts: Record<string, number> = {};
      for (const collection of collections) {
        const count = await wallpaperStorage.getFavoriteCount(collection.id);
        newCounts[collection.id] = count;
      }
      setCounts(newCounts);
    };
    fetchCounts();
  }, [collections]);

  // 确认删除
  const confirmDelete = () => {
    if (deletingId) {
      onDelete?.(deletingId);
      setDeletingId(null);
    }
  };

  // 创建新收藏夹
  const handleCreate = () => {
    if (newName.trim()) {
      onCreate?.(newName.trim());
      setNewName('');
    }
  };

  // 开始编辑名称
  const startEdit = (collection: WallpaperCollection) => {
    setEditingId(collection.id);
    setEditName(collection.name);
  };

  // 保存编辑
  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onRename?.(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <Card className={cn('rounded-xl', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderHeart className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 新建收藏夹 */}
        <div className="flex gap-2">
          <Input
            placeholder={t('newCollectionPlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 收藏夹列表 */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('emptyCollections')}
            </p>
          ) : (
            collections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'relative flex items-center gap-2 p-2.5 rounded-lg transition-all',
                  'hover:bg-accent/80 group cursor-pointer',
                  'border border-transparent hover:border-primary/20',
                  selectedId === collection.id && 'bg-accent border-primary/30'
                )}
                onClick={() => onSelect?.(collection)}
              >
                {/* 编辑模式 */}
                {editingId === collection.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm flex-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit(collection.id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-2">
                        {collection.name}
                        {counts[collection.id] !== undefined && counts[collection.id] > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                            <Image className="h-3 w-3 mr-1" />
                            {counts[collection.id]}
                          </Badge>
                        )}
                      </p>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {collection.description}
                        </p>
                      )}
                    </div>

                    {/* 操作菜单 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-60 hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(collection)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {t('rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingId(collection.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </motion.div>
            ))
          )}
        </div>
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCollection')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingId && counts[deletingId] > 0
                ? t('deleteCollectionWithItems', { count: counts[deletingId] })
                : t('deleteCollectionConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
