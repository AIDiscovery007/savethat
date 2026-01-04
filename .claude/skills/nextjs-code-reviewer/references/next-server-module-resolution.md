# Next.js `next/server` Module Resolution Error SOP

## Error Description

```
Could not find a declaration file for module 'next/server'.
'/path/to/project/node_modules/next/server.js' implicitly has an 'any' type.
If the 'next' package actually exposes this module, try adding a new declaration
(.d.ts) file containing `declare module 'next/server';`ts(7016)
```

## Root Cause

This is a **TypeScript Language Server cache/resolution issue**, not an actual code problem:

1. `next/server` types exist at `node_modules/next/server.d.ts`
2. `npx tsc --noEmit` compiles successfully (types are valid)
3. IDE shows error due to cache or module resolution mismatch with `bundler` setting
4. Common in Next.js 15+ with TypeScript 5.x and `moduleResolution: "bundler"`

## SOP: Best Practice Solution

### Step 1: Verify Build Works
```bash
npx tsc --noEmit
# Should pass without this specific error
```

### Step 2: Generate Next.js Route Types
```bash
npx next typegen
```
This generates `.next/types/**/*.ts` which helps TypeScript resolve modules.

### Step 3: Verify IDE Resolution
- Restart IDE's TypeScript server, or
- Simply wait for auto-refresh after `next typegen`

### Step 4: Verify Compilation
```bash
npx tsc --noEmit && npx next typegen
```

## Correct Import Syntax (Do NOT Change)

```typescript
// ✅ CORRECT - Use this
import { NextRequest, NextResponse } from 'next/server';

// ❌ WRONG - Do NOT use internal paths
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
```

### Why Not Internal Paths?

Using `next/dist/server/web/spec-extension/...` causes issues:
- Conflicts with Next.js internal type definitions
- May break route type validation
- Not officially supported

## Alternative Solutions (If Above Fails)

### Option A: Clear TypeScript Cache
```bash
rm -rf node_modules/.cache/typescript
# Then restart IDE
```

### Option B: Restart TypeScript Server
In VS Code:
1. `Cmd + Shift + P`
2. TypeScript: Restart TS Server

### Option C: Check tsconfig.json
Ensure `tsconfig.json` includes:
```json
{
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
```

## Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npx next typegen` succeeds
- [ ] Import is `from 'next/server'`
- [ ] No IDE errors after typegen

## Related Commands

```bash
# Full type check workflow
npx next typegen && npx tsc --noEmit

# In package.json scripts
"type-check": "next typegen && tsc --noEmit"
```

## References

- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js TypeScript Config](https://nextjs.org/docs/app/api-reference/config/typescript)
- [Next.js typegen CLI](https://nextjs.org/docs/app/api-reference/cli/next#next-typegen)
