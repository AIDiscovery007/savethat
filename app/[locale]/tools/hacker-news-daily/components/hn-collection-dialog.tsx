'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegoButton } from '@/components/ui/lego-button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { HNCollection, HNFavoriteItem } from '@/lib/storage/hn-types';

interface HNCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: HNCollection[];
  news: HNFavoriteItem['news'] | null;
  onSelectCollection: (collectionId: string) => void;
  onCreateCollection: (name: string) => void;
  isNewsInCollection: (collectionId: string) => Promise<boolean>;
}

export function HNCollectionDialog({
  open,
  onOpenChange,
  collections,
  news,
  onSelectCollection,
  onCreateCollection,
  isNewsInCollection,
}: HNCollectionDialogProps) {
  const t = useTranslations('HNCollection');
  const [newName, setNewName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [collectionStatus, setCollectionStatus] = React.useState<Map<string, boolean>>(new Map());

  // 当弹窗打开时，检查每个收藏夹的收藏状态
  React.useEffect(() => {
    if (!open || !news) {
      setCollectionStatus(new Map());
      return;
    }

    const checkStatus = async () => {
      const status = new Map<string, boolean>();
      for (const collection of collections) {
        const isIn = await isNewsInCollection(collection.id);
        status.set(collection.id, isIn);
      }
      setCollectionStatus(status);
    };

    checkStatus();
  }, [open, news, collections, isNewsInCollection]);

  // 重置状态
  React.useEffect(() => {
    if (!open) {
      setNewName('');
      setIsCreating(false);
    }
  }, [open]);

  // 创建新收藏夹
  const handleCreate = () => {
    if (newName.trim()) {
      onCreateCollection(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  // 选择收藏夹
  const handleSelect = (collectionId: string) => {
    onSelectCollection(collectionId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addToCollection')}</DialogTitle>
          <DialogDescription>
            {news ? t('selectCollectionDesc') : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 新建收藏夹 */}
          {isCreating ? (
            <div className="flex gap-2">
              <Input
                placeholder={t('newCollectionPlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1"
                autoFocus
              />
              <LegoButton size="sm" onClick={handleCreate}>
                {t('create')}
              </LegoButton>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('createNewCollection')}
            </Button>
          )}

          {/* 收藏夹列表 */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {collections.length === 0 && !isCreating && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('noCollectionsYet')}
              </p>
            )}
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => handleSelect(collection.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
                  'hover:bg-accent text-left'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{collection.name}</p>
                </div>
                {collectionStatus.get(collection.id) && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
