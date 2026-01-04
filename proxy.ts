import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import {routing} from './i18n/routing';

export function proxy(request: NextRequest) {
  return createMiddleware(routing)(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh|en)/:path*']
};
