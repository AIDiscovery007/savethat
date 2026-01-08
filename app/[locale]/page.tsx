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
function ToolIcon({ name }: { name: ToolIconName }) {
  const iconClass = 'h-6 w-6';
  switch (name) {
    case 'sparkle':
      return <SparkleIcon className={iconClass} />;
    case 'code':
      return <CodeIcon className={iconClass} />;
    case 'translate':
      return <TranslateIcon className={iconClass} />;
    case 'image':
      return <ImageIcon className={iconClass} />;
    case 'file-text':
      return <FileTextIcon className={iconClass} />;
    default:
      return <SparkleIcon className={iconClass} />;
  }
}

/**
 * LEGO 风格工具卡片组件
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
  // LEGO 风格颜色变体
  const colorVariants = {
    available: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      border: 'border-b-[6px] border-blue-400 dark:border-blue-400',
      accent: 'bg-blue-100 dark:bg-blue-900/50',
      stud: 'bg-blue-400',
      icon: 'text-blue-500 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    },
    beta: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/50',
      border: 'border-b-[6px] border-yellow-600 dark:border-yellow-500',
      accent: 'bg-yellow-100 dark:bg-yellow-900/50',
      stud: 'bg-yellow-500',
      icon: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    },
    experimental: {
      bg: 'bg-gray-50 dark:bg-gray-950/50',
      border: 'border-b-[6px] border-gray-600 dark:border-gray-500',
      accent: 'bg-gray-100 dark:bg-gray-900/50',
      stud: 'bg-gray-500',
      icon: 'text-gray-600 dark:text-gray-400',
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700',
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
              <ToolIcon name={tool.icon} />
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
