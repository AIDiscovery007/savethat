import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 工具聚合站",
  description: "聚合多种 AI 能力，提供提示词优化、代码生成、智能翻译等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={jetbrainsMono.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 导航栏 */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-lg">AI 工具聚合站</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/tools/prompt-optimizer"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                提示词优化
              </Link>
              <a
                href="#"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                关于
              </a>
            </nav>
          </div>
        </header>

        {/* 主内容 */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 页脚 */}
        <footer className="border-t py-6">
          <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
            <p>AI 工具聚合站 - 基于 AI 的提示词优化工具</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
