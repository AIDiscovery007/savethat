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

---

## Reusable Components (PRIORITY USE - Avoid Reinventing)

**BEFORE creating a new component, check if an existing one can be used!**

### High-Level UI Components

| Requirement | Use This Component | Location |
|-------------|-------------------|----------|
| Textarea with char count + images | `PromptInput` | `components/prompt-input.tsx` |
| Drag & drop file upload | `FileUploader` | `components/file-uploader.tsx` |
| Grid option selector (cards) | `OptionSelector` | `components/option-selector.tsx` |
| Copy to clipboard button | `CopyButton` | `components/copy-button.tsx` |
| Button with loading state | `SubmitButton` | `components/submit-button.tsx` |
| Loading placeholder | `LoadingPlaceholder` | `components/loading-placeholder.tsx` |
| Error message display | `ErrorDisplay` | `components/error-display.tsx` |
| Image with loading skeleton | `AsyncImage` | `components/async-image.tsx` |
| Page header with subtitle | `PageHeader` | `components/page-header.tsx` |
| Sidebar + content layout | `TwoColumnLayout` | `components/two-column-layout.tsx` |
| Empty state display | `Empty` | `components/ui/empty.tsx` |
| Fade-in animation | `BlurFade` | `components/ui/blur-fade.tsx` |

### Component Usage Examples

```tsx
// Textarea with char count and image upload
import { PromptInput } from '@/components/prompt-input'

<PromptInput
  value={prompt}
  onChange={setPrompt}
  onSubmit={handleSubmit}
  placeholder="Enter prompt..."
  maxLength={2000}
  showCount
  submitOnCtrlEnter
  images={images}
  onImagesChange={setImages}
  maxImages={5}
/>

// File upload with drag & drop
import { FileUploader } from '@/components/file-uploader'

<FileUploader
  accept="image/*,video/*"
  maxSizeMB={10}
  maxFiles={5}
  files={files}
  onChange={setFiles}
  previewType="image"
  multiple
/>

// Grid option selector
import { OptionSelector } from '@/components/option-selector'

<OptionSelector
  value={selectedValue}
  onChange={setSelectedValue}
  options={[
    { value: 'opt1', label: 'Option 1', icon: <Icon />, description: 'Description' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  columns={3}
/>

// Copy button
import { CopyButton } from '@/components/copy-button'

<CopyButton value={textToCopy} variant="ghost" size="icon-xs" />

// Loading button
import { SubmitButton } from '@/components/submit-button'

<SubmitButton loading={isLoading} loadingText="Processing...">
  Submit
</SubmitButton>

// Loading placeholder
import { LoadingPlaceholder } from '@/components/loading-placeholder'

<LoadingPlaceholder message="Analyzing..." icon={<Loader2 className="animate-spin" />} />

// Error display
import { ErrorDisplay } from '@/components/error-display'

<ErrorDisplay error={error} className="mt-4" />

// Page header
import { PageHeader } from '@/components/page-header'

<PageHeader
  title="Tool Title"
  subtitle="Optional description"
  action={<Button>Action</Button>}
/>

// Two column layout
import { TwoColumnLayout } from '@/components/two-column-layout'

<TwoColumnLayout
  sidebar={<SettingsPanel />}
  children={<MainContent />}
  sidebarClassName="lg:sticky lg:top-4"
/>

// Empty state
import { Empty } from '@/components/ui/empty'

<Empty
  icon={FileIcon}
  title="No data"
  description="Upload files to see results"
  action={{ label: 'Upload', onClick: handleUpload }}
/>

// Fade animation
import { BlurFade } from '@/components/ui/blur-fade'

<BlurFade delay={0.1} inView>
  <Content />
</BlurFade>
```

### shadcn/ui Base Components (components/ui/)

Use these for basic UI needs before creating custom components:

| Component | Purpose |
|-----------|---------|
| `Button` | Primary action buttons with variants (default, outline, ghost, etc.) |
| `Card` | Container with header, content, footer |
| `Input` / `Textarea` | Form inputs |
| `Label` | Form label |
| `Select` / `Combobox` | Dropdown selection |
| `Dialog` / `Sheet` | Modal and side drawer |
| `DropdownMenu` | Context menu |
| `Tabs` | Tab navigation |
| `Badge` | Status labels |
| `Progress` | Progress bar |
| `Skeleton` | Loading skeleton |
| `Tooltip` | Hover tooltips |
| `AlertDialog` | Confirmation dialogs |
| `Pagination` | Page navigation |

---

## Custom Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useOptimization` | 3-stage prompt optimization flow | `lib/hooks/use-optimization.ts` |
| `useHistory` | History CRUD + localStorage persistence | `lib/hooks/use-history.ts` |
| `useWallpaperFavorites` | Wallpaper collection management | `lib/hooks/use-wallpaper-favorites.ts` |
| `useCoverGeneration` | Cover generation state management | `lib/hooks/use-cover-generation.ts` |
| `useIsMounted` | SSR hydration check | `lib/hooks/use-is-mounted.ts` |
| `useLocalStorage` | Type-safe localStorage operations | `lib/hooks/use-local-storage.ts` |
| `useAihubmix` | AIHUBMIX API calls | `lib/hooks/use-aihubmix.ts` |

### Hook Usage Examples

```tsx
// SSR hydration check
import { useIsMounted } from '@/lib/hooks/use-is-mounted'

const isMounted = useIsMounted()
// Use to prevent hydration mismatches

// localStorage operations
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

const [value, setValue] = useLocalStorage<string>('key', 'default')

// History management
import { useHistory } from '@/lib/hooks/use-history'

const { records, saveRecord, deleteRecord, toggleFavorite } = useHistory()
```

---

## Anti-Patterns

| Category | Avoid |
|----------|-------|
| React | `'use client'` unnecessarily, `Date` in render, mutate state |
| TypeScript | `any`, `as any`, loose equality (`==`) |
| State | Everything in global state |
| **Components** | **Creating new components that duplicate existing ones** |

---

## Development Actions

| When... | Do this... |
|---------|------------|
| Adding new tool | 1. Register in `lib/tools/registry.ts` 2. Create `app/[locale]/tools/[tool-id]/page.tsx` 3. Add API route if needed |
| Adding AI feature | Use `lib/api/aihubmix/sdk-client.ts` for Vercel AI SDK, or `lib/api/aihubmix/client.ts` for direct API calls |
| Adding text input | Use `PromptInput` component - do NOT create new textarea |
| Adding file upload | Use `FileUploader` component - do NOT create new uploader |
| Adding option selection | Use `OptionSelector` component - do NOT create custom cards |
| Need copy button | Use `CopyButton` component |
| Need loading state | Use `SubmitButton` or `LoadingPlaceholder` |
| Need error display | Use `ErrorDisplay` component |
| Need empty state | Use `Empty` component |
| Need animation | Use `BlurFade` component |
| Need page layout | Use `PageHeader` + `TwoColumnLayout` |
| Need persistent state | Use `useHistory` hook + localStorage adapter |
| Need video processing | Add `runtime = 'nodejs'`, `maxDuration = 300` to API route |

---

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
