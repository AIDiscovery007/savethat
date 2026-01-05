import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: [
      '@phosphor-icons/react',
      '@lobehub/ui',
      '@lobehub/icons',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },
};

export default withNextIntl(nextConfig);
