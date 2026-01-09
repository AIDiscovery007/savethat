# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered tool platform built with Next.js 16 App Router. Plugin-like architecture with tools registered in `lib/tools/registry.ts` and accessed via `/tools/[tool-id]` routes.

## Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/debug-app` | Verify/debug with Playwright | User says: "debug", "verify", "test this page", "check for errors", "e2e test" |
| `/review-code` | Run code review | User says: "review", "audit", "check for bugs", "analyze code" |
| `/context7` | Query Context7 docs | User says: "docs", "documentation", "how to use X", "API reference" |
| `/ralph-loop` | Ralph Wiggum iterative solving | User says: "iterative", "loop", "try different approaches", "Ralph" |
| `/simplify-code` | Refactor code | User says: "simplify", "refactor", "clean up", "optimize code" |

## Skills & Agents

| Type | Name | Purpose | When to Use |
|------|------|---------|-------------|
| Skill | `aihubmix-models-helper` | AIHUBMIX model info | User mentions: "model", "AIHUBMIX", "which models", "model capabilities" |
| Skill | `npm-dep-resolver` | Dependency conflicts | User mentions: "dependency", "npm install", "peer dependency", "package conflict" |
| Skill | `lobehub-icons-helper` | LobeHub icons | User mentions: "icon", "lobehub icon", "Lucide", "@lobehub/icons" |
| Skill | `nextjs-code-reviewer` | Next.js 16 review | User says: "review Next.js", "check Next.js code" |
| Agent | `code-simplifier` | Simplify/refactor code | User says: "simplify this code", "refactor this component" |
| Agent | `feature-dev:code-architect` | Design feature architecture | User says: "architect", "design plan", "how should I implement", "architecture" |
| Agent | `feature-dev:code-explorer` | Analyze codebase patterns | User says: "explore", "analyze codebase", "find patterns", "how does X work" |
| Agent | `feature-dev:code-reviewer` | Review code for bugs | User says: "review for bugs", "check for issues", "security review" |

## MCP Servers (Always Active)

| When user mentions... | Use this MCP tool... |
|----------------------|---------------------|
| "docs", "API", "how to use" | `context7_query-docs` |
| "browser", "verify", "playwright", "test", "click", "type", "navigate" | `mcp__playwright__browser_*` |
| "task", "ticket", "kanban", "project" | `mcp__vibe_kanban__*` |
| "diagnostics", "errors", "tsc", "lint" | `mcp__ide__getDiagnostics` |
| "Supabase", "database", "SQL", "query" | `mcp__plugin_supabase_supabase__*` |

## Architecture

- **Tool System**: `lib/tools/registry.ts` defines tool metadata; each tool in `app/[locale]/tools/[tool-id]/`
- **AI**: Vercel AI SDK with aihubmix provider (`lib/api/aihubmix/`)
- **i18n**: `next-intl` with `app/[locale]/` routing, locales: en, zh
- **UI**: shadcn/ui + Tailwind CSS 4, Radix UI primitives, `@lobehub/icons`

## Key Files

| Path | Purpose |
|------|---------|
| `lib/tools/registry.ts` | Tool registration |
| `app/[locale]/layout.tsx` | Root layout |
| `lib/api/aihubmix/client.ts` | AI SDK config |
| `.claude/settings.json` | Hooks & settings |
| `lib/hooks/*.ts` | Custom hooks |
| `components/prompt-input.tsx` | Textarea with char count |
| `components/file-uploader.tsx` | Drag & drop file upload |
| `components/option-selector.tsx` | Grid option selector |

## Dependencies

React 19 (`legacy-peer-deps`), TypeScript 5, Tailwind CSS 4, ESLint 9

## Code Style

### TypeScript
- Strict mode; avoid `any`
- Use `unknown` for unknown types, `Record<K, V>` for objects
- `ComponentNameProps` pattern for props

### React Components
- Order: imports → types → constants → helpers → component → sub-components
- Early returns to reduce nesting
- Default to Server Components; only `'use client'` when needed

### Component Reusability (CRITICAL)

| New Requirement | Reusable Component |
|-----------------|-------------------|
| Textarea with char count | `PromptInput` |
| File upload (drag & drop) | `FileUploader` |
| Option selector (grid) | `OptionSelector` |

### Custom Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useOptimization` | 3-stage prompt optimization flow | `lib/hooks/use-optimization.ts` |
| `useHistory` | History CRUD + localStorage | `lib/hooks/use-history.ts` |
| `useWallpaperFavorites` | Wallpaper collection management | `lib/hooks/use-wallpaper-favorites.ts` |
| `useCoverGeneration` | Cover generation state | `lib/hooks/use-cover-generation.ts` |
| `useIsMounted` | SSR hydration check | `lib/hooks/use-is-mounted.ts` |

## Anti-Patterns

| Category | Avoid |
|----------|-------|
| React | `'use client'` unnecessarily, `Date` in render, mutate state |
| TypeScript | `any`, `as any`, loose equality (`==`) |
| State | Everything in global state |

## Next.js 16 Patterns

```typescript
// API Route
export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({ result })
}

// Video Processing
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Server Action
'use server'
export async function createUser(formData: FormData) {
  await db.user.create({ data: { name: formData.get('name') as string } })
}
```

## Tools Registry

| ID | Name | Category | Status |
|---|------|----------|--------|
| prompt-quiz | 提问挑战 | game | available |
| prompt-trainer | 提问训练 | prompt | available |
| prompt-optimizer | 提示词优化 | prompt | available |
| code-generator | 代码生成 | code | beta |
| text-translator | 智能翻译 | translation | experimental |
| image-generator | 图像生成 | image | experimental |
| text-summarizer | 文本摘要 | text | experimental |
| ski-analysis | 滑雪动作分析 | video | available |
| cover-generator | 小红书封面生成器 | image | experimental |
| xiaohongshu-analytics | 小红书分析 | analysis | experimental |
| wallhaven-gallery | 壁纸画廊 | image | available |

## API Routes

| Path | Purpose |
|------|---------|
| `/api/aihubmix` | General AI chat (Vercel AI SDK) |
| `/api/prompt-trainer` | Prompt training (action-based) |
| `/api/tools/prompt-quiz` | Prompt quiz game |
| `/api/ski-analysis` | Ski video analysis |
| `/api/cover-generator` | Cover generation |
| `/api/xiaohongshu/analyze` | Xiaohongshu analytics |
| `/api/wallhaven/search` | Wallpaper search |
| `/api/wallhaven/wallpaper/[id]/download` | Wallpaper download |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `AIHUBMIX_API_KEY` | Aihubmix API key |
| `AIHUBMIX_BASE_URL` | API base URL (default: https://aihubmix.com/v1) |
| `DEFAULT_MODEL` | Default model (default: gemini-1.5-pro) |
| `ENABLE_STREAMING` | Enable streaming responses |
| `WALLHAVEN_API_KEY` | Wallhaven API key |
| `API_TIMEOUT_MS` | API timeout in milliseconds |

## Development Actions

| When... | Do this... |
|---------|------------|
| Adding new tool | 1. Register in `lib/tools/registry.ts` 2. Create `app/[locale]/tools/[tool-id]/page.tsx` 3. Add API route if needed |
| Adding AI feature | Use `lib/api/aihubmix/sdk-client.ts` for Vercel AI SDK, or `lib/api/aihubmix/client.ts` for direct API calls |
| Adding file upload | Use `FileUploader` component with `components/file-uploader.tsx` |
| Adding textarea input | Use `PromptInput` component with `components/prompt-input.tsx` |
| Adding option grid | Use `OptionSelector` component with `components/option-selector.tsx` |
| Need persistent state | Use `useHistory` hook + localStorage adapter |
| Need video processing | Add `runtime = 'nodejs'`, `maxDuration = 300` to API route |
