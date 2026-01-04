---
name: lobehub-icons-helper
description: "Helper for using @lobehub/icons in your project. Use when: (1) Need to add AI/brand icons to UI, (2) Need to replace existing icons with lobehub icons, (3) Need to find correct icon names and imports, (4) Need to resolve icon package dependencies."
---

# LobeHub Icons Helper Skill

## Quick Start

### Install @lobehub/icons
```bash
npm install @lobehub/icons
```

### Check Available Icons
```bash
grep "export.*YourIconName" node_modules/@lobehub/icons/es/icons.d.ts
```

### Common AI Icons
| Icon | Import Name | Export Key |
|------|-------------|------------|
| Claude | `Claude` | `Claude` |
| OpenAI | `OpenAI` | `OpenAI` |
| Gemini | `Gemini` | `Gemini` |
| DeepSeek | `DeepSeek` | `DeepSeek` |
| ChatGPT | Use `OpenAI` | `OpenAI` |
| Grok | `Grok` | `Grok` |

## Usage Pattern

### 1. Import Icons
```typescript
import { Claude, Gemini, DeepSeek, OpenAI } from '@lobehub/icons';
```

### 2. Create Icon Map
```typescript
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Claude,
  OpenAI,
  Gemini,
  DeepSeek,
};
```

### 3. Use in Config
```typescript
// lib/config/ai-clients.ts
export const AI_CLIENTS = [
  {
    id: 'claude',
    name: 'Claude',
    iconName: 'Claude',  // Must match ICON_MAP key
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    iconName: 'OpenAI',  // Use OpenAI for ChatGPT
  },
];
```

### 4. Use in Component
```typescript
// In your component
const Icon = ICON_MAP[client.iconName] || Claude;
return <Icon className="h-4 w-4" />;
```

## Installation Requirements

### Peer Dependencies
```bash
# @lobehub/icons requires these peer dependencies
npm install antd @lobehub/ui react react-dom
```

### If Using with lucide-react Icons
```bash
npm install lucide-react
```

## Troubleshooting

### "Module has no exported member"
1. Check exact export name: `grep "export.*IconName" node_modules/@lobehub/icons/es/icons.d.ts`
2. Remove `Icon` prefix - exports are named without prefix
3. Example: Use `Claude` not `IconClaude`

### Turbopack/Build Errors
1. Try clean reinstall: `rm -rf node_modules package-lock.json && npm install`
2. Ensure peer dependencies are installed

### Icon Not Showing
1. Verify the icon key exists in your ICON_MAP
2. Check the `iconName` in your config matches exactly
3. Add fallback: `const Icon = ICON_MAP[key] || DefaultIcon;`

## Finding Icon Names

### Method 1: Check TypeScript Declarations
```bash
cat node_modules/@lobehub/icons/es/icons.d.ts
```

### Method 2: Search for Specific Icon
```bash
grep -i "claude\|gpt\|gemini" node_modules/@lobehub/icons/es/icons.d.ts
```

### Method 3: Check Package Structure
```
node_modules/@lobehub/icons/
├── es/
│   ├── index.js          # Main entry
│   ├── icons.d.ts        # All icon exports
│   ├── Claude.d.ts       # Individual icon
│   ├── OpenAI.d.ts
│   └── ...
```

## Full SOP: Adding AI Client Icons

### Step 1: Install Package
```bash
npm install @lobehub/icons
npm install antd @lobehub/ui  # peer deps
npm install lucide-react      # for status icons
```

### Step 2: Update Config File
```typescript
// lib/config/ai-clients.ts
export const AI_CLIENTS = [
  { id: 'claude', name: 'Claude', iconName: 'Claude' },
  { id: 'chatgpt', name: 'ChatGPT', iconName: 'OpenAI' },
  { id: 'gemini', name: 'Gemini', iconName: 'Gemini' },
  { id: 'deepseek', name: 'DeepSeek', iconName: 'DeepSeek' },
];
```

### Step 3: Update Component
```typescript
// components/ai-client-sender.tsx
import { Claude, Gemini, DeepSeek, OpenAI } from '@lobehub/icons';
import { CheckCircle, XCircle } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Claude,
  OpenAI,
  Gemini,
  DeepSeek,
};
```

### Step 4: Verify
```bash
npm run build
```

## Available Icons Reference

### AI/LLM Brands
- Anthropic: `Claude`
- OpenAI: `OpenAI` (works for ChatGPT)
- Google: `Gemini`
- DeepSeek: `DeepSeek`
- Grok: `Grok`
- Mistral: `Mistral`
- Llama: `Llama`

### Common Icons
- Loading states: `Loading`
- Settings: `Settings`
- Plus/Minus: `Plus`, `Minus`
- Navigation: `Home`, `User`, `Bell`

Note: For complete icon list, check `node_modules/@lobehub/icons/es/icons.d.ts`
