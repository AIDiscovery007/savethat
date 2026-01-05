# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered tool platform built with Next.js 16 App Router. It features a plugin-like architecture where tools are registered in a central registry and accessed via `/tools/[tool-id]` routes.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Tool System

- Tools are defined in `lib/tools/registry.ts` with metadata (id, name, path, category, status)
- Each tool lives in `app/[locale]/tools/[tool-id]/` as a self-contained feature
- Tools use a consistent pattern: page component + hooks + API routes

### AI Integration

- Vercel AI SDK with aihubmix provider (`lib/api/aihubmix/`)
- API routes proxy requests through `/app/api/aihubmix/route.ts`
- Model configurations use environment variables:
  - `AIHUBMIX_API_KEY`, `AIHUBMIX_BASE_URL`, `DEFAULT_MODEL`

### Internationalization

- Locale-aware routing via `app/[locale]/` dynamic segment
- `next-intl` for translations (`i18n/` config, `messages/` translations)
- Supported locales: English (`en`), Chinese (`zh`)
- Use `i18n/navigation.ts` Link for internal navigation

### UI Components

- shadcn/ui pattern with Tailwind CSS 4 + CSS variables
- Components in `components/ui/` built on Radix UI primitives
- Use `cn()` utility (`lib/utils/cn.ts`) for class merging
- Icons: Phosphor Icons, Lucide, LobeHub icons (`@lobehub/icons`)

### Key Files

- `lib/tools/registry.ts` - Tool registration and discovery
- `app/[locale]/layout.tsx` - Root layout with nav and i18n
- `lib/api/aihubmix/client.ts` - AI SDK client configuration
- `.claude/skills/` - Custom Claude skills (aihubmix-models-helper, lobehub-icons-helper)

## Dependencies

- React 19 with `legacy-peer-deps=true` in `.npmrc` for compatibility
- TypeScript 5, Tailwind CSS 4, ESLint 9

## Code Style

### TypeScript

- Enable strict mode; avoid `any` unless absolutely necessary
- Use `unknown` for truly unknown types, `Record<K, V>` for objects
- Interfaces for object shapes that may be extended; types for unions/intersections
- Component props naming: `ComponentNameProps` pattern

### React Components

- Order: imports → types → constants → helpers → main component → sub-components
- Destructure props directly in function signature for required props
- Use early returns to reduce nesting

## Best Practices

### Server Components First

- Default to Server Components; only use `'use client'` when interactivity is needed
- Wrap async components in `Suspense` with proper fallbacks
- Avoid browser-only APIs (`window`, `localStorage`, `document`) in Server Components

### Error Handling

- Use try/catch with specific error messages
- Return meaningful error states rather than throwing silently
- Log errors appropriately for debugging

### Code Quality

- Write self-documenting code with clear variable names
- Extract complex logic into well-named functions
- Keep functions small and single-purpose (SRP)

### Security

- Validate all user inputs on the server
- Prefix client-side env vars with `NEXT_PUBLIC_`
- Never expose API keys or secrets in client code

## Anti-Patterns to Avoid

### React/Next.js

- Do NOT use `'use client'` unnecessarily (increases client bundle)
- Do NOT use `Date`, `Math.random()` directly in component render (causes hydration mismatch)
- Do NOT mutate state directly; always use immutable updates
- Do NOT use `useEffect` for data fetching in Client Components (use React Query or SWR)

### TypeScript

- Do NOT use `any` without explicit justification comment
- Do NOT use `as any` to bypass type checking
- Do NOT ignore TypeScript errors
- Do NOT use loose equality (`==`) instead of strict equality (`===`)

### State Management

- Do NOT put everything in global state; use local state when appropriate
- Do NOT use `useEffect` for side effects that can be handled otherwise

## Next.js 16 Patterns

### API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ result })
}
```

### Server Actions

```typescript
'use server'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  await db.user.create({ data: { name } })
}
```
