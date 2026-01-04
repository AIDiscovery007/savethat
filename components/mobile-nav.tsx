'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ListIcon, InfoIcon, SparkleIcon } from '@phosphor-icons/react';
import { getAllTools } from '@/lib/tools/registry';

export function MobileNav() {
  const t = useTranslations('Navigation');
  const tTools = useTranslations('Tools');
  const tools = getAllTools();
  const [mounted, setMounted] = React.useState(false);

  // Use client-only rendering to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use uncontrolled mode to avoid hydration mismatch
  const getToolName = (toolId: string) => {
    return tTools(`${toolId}.name`);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="md:hidden">
        <ListIcon className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <ListIcon className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <SparkleIcon className="h-5 w-5" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 py-4">
          <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
            {tTools('tools')}
          </div>
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.path}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span>{getToolName(tool.id)}</span>
            </Link>
          ))}
          <div className="border-t my-2" />
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <InfoIcon className="h-4 w-4" />
            <span>{t('about')}</span>
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
