'use client';

import {Link} from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { getAllTools, type ToolStatus, type ToolIconName } from '@/lib/tools/registry';
import { cn } from '@/lib/utils';
import { SparkleIcon, CodeIcon, TranslateIcon, ImageIcon, FileTextIcon, ArrowRightIcon } from '@phosphor-icons/react';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tTools = useTranslations('Tools');
  const tools = getAllTools();
  const availableTools = tools.filter(t => t.status === 'available');
  const betaTools = tools.filter(t => t.status === 'beta');
  const experimentalTools = tools.filter(t => t.status === 'experimental');

  const statusLabels: Record<ToolStatus, string> = {
    available: t('available'),
    beta: t('beta'),
    experimental: t('experimental'),
  };

  const getToolName = (toolId: string) => {
    return tTools(`${toolId}.name`);
  };

  const getToolDescription = (toolId: string) => {
    return tTools(`${toolId}.description`);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Hero 区域 */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 rounded-md border border-blue-100 shadow-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-sm" />
          <span className="text-xs font-bold tracking-wider uppercase text-blue-700">{t('badge')}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {t('title')}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          {t('subtitle')}
        </p>
      </div>

      {/* 可用工具 */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 rounded-md border border-blue-100 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
            <span className="text-xs font-bold tracking-wider uppercase text-blue-700">{t('available')}</span>
          </div>
          <h2 className="text-xl font-semibold">{t('availableTools')}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              name={getToolName(tool.id)}
              description={getToolDescription(tool.id)}
              statusLabels={statusLabels}
              useNow={t('useNow')}
            />
          ))}
        </div>
      </section>

      {/* Beta 工具 */}
      {betaTools.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-yellow-100/50 px-3 py-1.5 rounded-md border border-yellow-100 shadow-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-sm" />
              <span className="text-xs font-bold tracking-wider uppercase text-yellow-700">{t('beta')}</span>
            </div>
            <h2 className="text-xl font-semibold">{t('betaTools')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {betaTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                name={getToolName(tool.id)}
                description={getToolDescription(tool.id)}
                statusLabels={statusLabels}
                useNow={t('useNow')}
              />
            ))}
          </div>
        </section>
      )}

      {/* 实验性工具 */}
      {experimentalTools.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-gray-100/50 px-3 py-1.5 rounded-md border border-gray-100 shadow-sm">
              <div className="w-2 h-2 bg-gray-500 rounded-sm" />
              <span className="text-xs font-bold tracking-wider uppercase text-gray-700">{t('experimental')}</span>
            </div>
            <h2 className="text-xl font-semibold">{t('experimentalTools')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experimentalTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                name={getToolName(tool.id)}
                description={getToolDescription(tool.id)}
                statusLabels={statusLabels}
                useNow={t('useNow')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * 图标渲染组件
 */
function ToolIcon({ name, className = 'h-6 w-6' }: { name: ToolIconName; className?: string }) {
  switch (name) {
    case 'sparkle':
      return <SparkleIcon className={className} />;
    case 'code':
      return <CodeIcon className={className} />;
    case 'translate':
      return <TranslateIcon className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    case 'file-text':
      return <FileTextIcon className={className} />;
    default:
      return <SparkleIcon className={className} />;
  }
}

/**
 * 米白色调工具卡片组件
 */
function ToolCard({
  tool,
  name,
  description,
  statusLabels,
  useNow
}: {
  tool: ReturnType<typeof getAllTools>[0];
  name: string;
  description: string;
  statusLabels: Record<ToolStatus, string>;
  useNow: string;
}) {
  // 米白色调统一风格
  const colorVariants = {
    available: {
      bg: 'bg-card-beige dark:bg-card-beige',
      border: 'border-b-[6px] border-card-beige-border dark:border-card-beige-border',
      accent: 'bg-card-beige-surface dark:bg-card-beige-surface',
      stud: 'bg-card-beige-border dark:border-card-beige-border',
      icon: 'text-card-beige-icon dark:text-card-beige-icon',
      badge: 'bg-card-beige-badge text-card-beige-text dark:bg-card-beige-badge dark:text-card-beige-text border-transparent',
    },
    beta: {
      bg: 'bg-card-beige dark:bg-card-beige',
      border: 'border-b-[6px] border-card-beige-border dark:border-card-beige-border',
      accent: 'bg-card-beige-surface dark:bg-card-beige-surface',
      stud: 'bg-card-beige-border dark:border-card-beige-border',
      icon: 'text-card-beige-icon dark:text-card-beige-icon',
      badge: 'bg-card-beige-badge text-card-beige-text dark:bg-card-beige-badge dark:text-card-beige-text border-transparent',
    },
    experimental: {
      bg: 'bg-card-beige dark:bg-card-beige',
      border: 'border-b-[6px] border-card-beige-border dark:border-card-beige-border',
      accent: 'bg-card-beige-surface dark:bg-card-beige-surface',
      stud: 'bg-card-beige-border dark:border-card-beige-border',
      icon: 'text-card-beige-icon dark:text-card-beige-icon',
      badge: 'bg-card-beige-badge text-card-beige-text dark:bg-card-beige-badge dark:text-card-beige-text border-transparent',
    },
  };

  const variant = colorVariants[tool.status];

  return (
    <Link href={tool.path} className="block group">
      <div
        className={cn(
          'relative h-full min-h-[200px] p-6 rounded-2xl',
          'transition-all duration-300 hover:-translate-y-2 hover:shadow-xl',
          'flex flex-col justify-between cursor-pointer overflow-hidden',
          variant.bg,
          variant.border
        )}
      >
        {/* 顶部装饰：两个 stud */}
        <div className="flex gap-3 mb-4 relative z-10">
          <div className={cn('w-4 h-4 rounded-full', variant.stud)} />
          <div className={cn('w-4 h-4 rounded-full', variant.stud)} />
        </div>

        <div className="relative z-10">
          {/* 标题行：图标 + badge */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-2 rounded-lg', variant.accent)}>
              <ToolIcon name={tool.icon} className={variant.icon} />
            </div>
            <Badge
              variant="outline"
              className={cn(
                'rounded-full text-xs font-medium border-2',
                variant.badge
              )}
            >
              {statusLabels[tool.status]}
            </Badge>
          </div>

          {/* 标题和描述 */}
          <h3 className="text-xl font-semibold leading-tight mb-2 text-foreground">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* 底部 "Use now" 箭头 */}
        <div className="mt-6 relative z-10">
          <div className="flex items-center text-sm font-medium text-foreground">
            <span>{useNow}</span>
            <div className="ml-2 w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border-b-2 border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:translate-x-1">
              <ArrowRightIcon className="w-4 h-4 text-foreground" />
            </div>
          </div>
        </div>

        {/* Stud pattern 装饰（悬停时更明显） */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2.5px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />
        </div>
      </div>
    </Link>
  );
}
