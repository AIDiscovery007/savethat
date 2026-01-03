'use client';

import {Link} from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllTools, type ToolStatus, type ToolIconName } from '@/lib/tools/registry';
import { SparkleIcon, CodeIcon, TranslateIcon, ImageIcon, FileTextIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

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
    <div className="container mx-auto max-w-6xl space-y-8 py-12">
      {/* Hero 区域 */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-none bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <SparkleIcon className="h-4 w-4" />
          {t('badge')}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* 可用工具 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Badge variant="default" className="rounded-none">{t('available')}</Badge>
          {t('availableTools')}
        </h2>
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
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Badge variant="secondary" className="rounded-none">{t('beta')}</Badge>
            {t('betaTools')}
          </h2>
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
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Badge variant="outline" className="rounded-none">{t('experimental')}</Badge>
            {t('experimentalTools')}
          </h2>
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
  const iconClass = 'h-5 w-5';
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
 * 工具卡片组件
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
  const statusColors: Record<ToolStatus, string> = {
    available: 'bg-green-500/10 text-green-600',
    beta: 'bg-yellow-500/10 text-yellow-600',
    experimental: 'bg-gray-500/10 text-gray-600',
  };

  return (
    <Link href={tool.path} className="block group">
      <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-primary">
              <ToolIcon name={tool.icon} />
            </div>
            <Badge
              variant="outline"
              className={cn('rounded-none', statusColors[tool.status])}
            >
              {statusLabels[tool.status]}
            </Badge>
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {name}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
            {useNow}
            <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
