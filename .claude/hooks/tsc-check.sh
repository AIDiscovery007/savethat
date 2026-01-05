#!/bin/bash
# TypeScript 类型检查 Hook
# 触发条件: git commit 时自动运行类型检查

cd "$CLAUDE_PROJECT_DIR"

# 获取所有暂存的 TypeScript 文件
staged_ts_files=$(git diff --cached --name-only -- '*.ts' '*.tsx' 2>/dev/null | head -20)

if [ -n "$staged_ts_files" ]; then
  echo "Running TypeScript check on staged files..."
  npx tsc --noEmit 2>&1 | head -50

  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✓ TypeScript check passed"
    exit 0
  else
    echo "✗ TypeScript errors found"
    exit 2
  fi
else
  echo "No TypeScript files staged, skipping check"
  exit 0
fi
