#!/bin/bash
# Code Review 自动触发 Hook
# 触发条件: Stop 事件（任务完成时）

cd "$CLAUDE_PROJECT_DIR"

echo "=== Auto Code Review Trigger ==="
echo "Checking for modified files..."

# 获取已修改的文件
modified_files=$(git status --porcelain 2>/dev/null | grep -E '^\s*M' | awk '{print $2}' | head -20)

if [ -z "$modified_files" ]; then
  echo "No modified files found"
  exit 0
fi

echo "Modified files:"
echo "$modified_files"

# 检查是否有 TypeScript/TSX 文件需要审查
ts_files=$(echo "$modified_files" | grep -E '\.(ts|tsx)$' | head -10)

if [ -n "$ts_files" ]; then
  echo ""
  echo "Running TypeScript check..."
  npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -10 || echo "✓ TypeScript check passed"

  echo ""
  echo "Checking for common issues..."

  # 检查 use client 滥用
  client_components=$(echo "$ts_files" | xargs grep -l "'use client'" 2>/dev/null | head -5)
  if [ -n "$client_components" ]; then
    echo "Client components found:"
    echo "$client_components"
  fi

  # 检查 any 类型使用
  any_usage=$(echo "$ts_files" | xargs grep -n ": any" 2>/dev/null | head -5)
  if [ -n "$any_usage" ]; then
    echo "⚠ 'any' type usage detected:"
    echo "$any_usage"
  fi
fi

echo ""
echo "=== Review Complete ==="

exit 0
