import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {LocaleSwitcher} from '@/components/locale-switcher';
import {MobileNav} from '@/components/mobile-nav';
import type { ReactNode } from 'react';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();
  const t = await getTranslations({locale, namespace: 'Navigation'});

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* 导航栏 */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-all duration-200">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6 md:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            {/* 移动端导航按钮 */}
            <MobileNav />
            <Link href="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80">
              <span className="text-base md:text-lg">{t('title')}</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="#"
              className="hidden md:inline-flex transition-colors hover:text-foreground/80 text-foreground/60 px-3 py-1.5 rounded-(--radius) hover:bg-muted"
            >
              {t('about')}
            </a>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* 主内容 */}
      <main className="min-h-screen">
        <div className="container mx-auto max-w-6xl px-6 md:px-8 lg:px-10 py-6 md:py-8 lg:py-10">
          {children}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t py-8">
        <div className="container mx-auto max-w-6xl px-6 md:px-8 lg:px-10 text-center text-sm text-muted-foreground">
          <p>{t('title')} - {t('description')}</p>
        </div>
      </footer>
    </NextIntlClientProvider>
  );
}
