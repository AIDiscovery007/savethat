'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Heart, FolderPlus, Image, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant?: 'collections' | 'favorites' | 'search' | 'default';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantIcons = {
  collections: FolderPlus,
  favorites: Heart,
  search: Search,
  default: Image,
};

const variantGradients = {
  collections: 'from-pink-500/20 via-purple-500/10 to-indigo-500/20',
  favorites: 'from-red-500/20 via-rose-500/10 to-pink-500/20',
  search: 'from-blue-500/20 via-cyan-500/10 to-teal-500/20',
  default: 'from-primary/10 via-primary/5 to-primary/10',
};

export function WallpaperEmptyState({
  variant = 'default',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = variantIcons[variant];
  const gradient = variantGradients[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        'relative overflow-hidden rounded-2xl',
        className
      )}
    >
      {/* Background gradient blob */}
      <div
        className={cn(
          'absolute inset-0 opacity-30 bg-gradient-to-br',
          gradient
        )}
      />
      {/* Animated dots pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 space-y-4 max-w-sm">
        {/* Icon with glow effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative inline-flex"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div
            className={cn(
              'relative rounded-2xl p-5',
              'bg-gradient-to-br from-background/80 to-background/40',
              'backdrop-blur-xl border border-white/10'
            )}
          >
            <Icon className="h-10 w-10 text-primary" />
          </div>
        </motion.div>

        {/* Text content */}
        <div className="space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-lg font-semibold"
          >
            {title}
          </motion.h3>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Action button */}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Button
              onClick={action.onClick}
              className="gap-2"
              size="lg"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
