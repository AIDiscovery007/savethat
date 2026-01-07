# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered tool platform built with Next.js 16 App Router. Plugin-like architecture with tools registered in `lib/tools/registry.ts` and accessed via `/tools/[tool-id]` routes.

## Commands

| Command | Purpose |
|---------|---------|
| `/debug-app` | Verify/debug with Playwright |
| `/review-code` | Run code review |
| `/context7` | Query Context7 docs |
| `/ralph-loop` | Ralph Wiggum iterative solving |
| `/simplify-code` | Refactor code |

## Skills & Agents

| Type | Name | Purpose |
|------|------|---------|
| Skill | `aihubmix-models-helper` | AIHUBMIX model info |
| Skill | `npm-dep-resolver` | Dependency conflicts |
| Skill | `lobehub-icons-helper` | LobeHub icons |
| Skill | `nextjs-code-reviewer` | Next.js 16 review |
| Agent | `code-simplifier` | Simplify/refactor code |
| Agent | `feature-dev:code-architect` | Design feature architecture |
| Agent | `feature-dev:code-explorer` | Analyze codebase patterns |
| Agent | `feature-dev:code-reviewer` | Review code for bugs |

## MCP Servers (Always Active)

| When user mentions... | Use this MCP tool... |
|----------------------|---------------------|
| "docs", "API", "how to use" | `context7_query-docs` |
| "browser", "verify", "playwright" | `mcp__playwright__browser_*` |
| "task", "ticket", "kanban" | `mcp__vibe_kanban__*` |
| "diagnostics", "errors" | `mcp__ide__getDiagnostics` |

## Auto-Invocation Rules

| User mentions... | Claude should... |
|------------------|------------------|
| "model", "AIHUBMIX" | Invoke `aihubmix-models-helper` |
| "dependency", "npm" | Invoke `npm-dep-resolver` |
| "icon", "lobehub" | Invoke `lobehub-icons-helper` |
| "review Next.js" | Invoke `nextjs-code-reviewer` |
| "simplify", "refactor" | Use `code-simplifier` agent |
| "architect", "design plan" | Use `feature-dev:code-architect` agent |
| "explore", "analyze" | Use `feature-dev:code-explorer` agent |

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

| Tool | Category | Status | Description |
|------|----------|--------|-------------|
