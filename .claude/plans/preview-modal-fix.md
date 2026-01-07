# 封面预览模态框优化

## 问题分析

当前 `CoverCard` 中的预览模态框存在以下问题：

1. **蒙版效果不明确** - 仅使用 `bg-black`，缺少 shadcn 风格的 `bg-black/80 backdrop-blur-sm`
2. **无动画效果** - 缺少淡入淡出动画
3. **关闭按钮样式** - ghost 按钮在深色背景下可⻅性不足
4. **层级不统⼀** - 与 AlertDialog 的 z-index 体系不一致

## 优化方案

参考 shadcn Dialog 和 AlertDialog 的最佳实践，重构预览模态框：

### 关键改进

| 项目 | 当前实现 | 优化后 |
|------|---------|--------|
| 蒙版 | `bg-black` | `bg-black/80 backdrop-blur-sm` |
| 动画 | 无 | `animate-in fade-in zoom-in` / `animate-out fade-out zoom-out` |
| 容器 | 仅有 backdrop | 独立的 dialog overlay + content |
| 关闭按钮 | ghost 灰⽩ | secondary + 悬浮效果 |
| 响应式 | 固定按钮 | 移动到底部居中 |

### 文件修改

**文件**: `app/[locale]/tools/cover-generator/components/cover-card.tsx`

1. 重构预览模态框结构，使用 shadcn 动画类
2. 添加独立的 overlay 和 content 容器
3. 优化关闭按钮位置和样式
4. 保持 z-index 与 AlertDialog ⼀致

### 动画类 (参考 shadcn)

```tsx
// Overlay
"fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

// Content
"fixed z-[101] grid w-full max-w-lg gap-4 bg-background p-6 shadow-lg duration-200 sm:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
```

### 实现要点

- 使⽤ `data-[state=*]` 属性⽀持动画状态
- 统⼀ z-index: overlay=100, content=101
- ESC 键关闭 + 点击外部关闭
- 响应式布局适配
