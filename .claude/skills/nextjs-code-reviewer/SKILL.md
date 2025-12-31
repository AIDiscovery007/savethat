---
name: nextjs-code-reviewer
description: "Reviews Next.js 16 code for bugs, TypeScript errors, and anti-patterns. Use when: (1) User asks to review, audit, or check code for bugs, (2) Working with Next.js 16 App Router projects, (3) TypeScript type errors need fixing, (4) React component issues like hooks rules, (5) Server/Client Component boundary issues."
---

# Next.js 16 Code Review Skill

## Quick Start

1. **Read files**: Use Read tool to examine code files
2. **Run analysis**: Execute `scripts/analyze_code.py` to identify issues
3. **Review findings**: Check `references/nextjs-bugs.md` for common patterns
4. **Fix types**: Use `references/typescript-fixes.md` for TypeScript solutions

## Core Review Areas

### TypeScript Errors
- `any` type usage without justification
- Missing type annotations
- Improper generic usage
- Type inference issues

### React/Next.js Issues
- `useEffect` missing dependencies
- `useState` initialization problems
- Server Component misused as Client
- Missing `'use client'` directive
- Hydration mismatches

### Next.js 16 Patterns
- App Router API routes
- Server Actions usage
- Layout/Page component rules
- Dynamic routes handling
- Image/font optimization

## Using Helper Scripts

Run code analysis:
```bash
scripts/analyze_code.py <file-path>
```

This script identifies common issues and outputs a report.

## Reference Files

- **[NEXTJS-BUGS.md](references/nextjs-bugs.md)**: Common Next.js 16 bugs and fixes
- **[TYPESCRIPT-FIXES.md](references/typescript-fixes.md)**: TypeScript error solutions
