#!/bin/bash
# 组件模板生成 Hook
# 触发条件: 新建 .tsx 组件文件时自动生成模板

cd "$CLAUDE_PROJECT_DIR"

# 从 stdin 读取文件路径
file_path=$(jq -r '.tool_input.file_path' /dev/stdin 2>/dev/null)

if [ -z "$file_path" ] || [ "$file_path" = "null" ]; then
  exit 0
fi

# 检查是否是 components 目录下的新文件
if echo "$file_path" | grep -qE 'components/.*\.tsx$' && [ ! -f "$file_path" ]; then
  echo "New component detected: $file_path"

  # 提取组件名（兼容 macOS sed）
  component_name=$(basename "$file_path" .tsx | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1' | tr -d ' ')
  component_filename=$(basename "$file_path" .tsx)

  # 提取目录路径
  component_dir=$(dirname "$file_path")
  feature_name=$(basename "$component_dir")

  # 读取现有文件内容（如果是空文件）
  if [ -s "$file_path" ]; then
    echo "File already exists, checking for template..."
    if ! head -3 "$file_path" | grep -q "'use client'"; then
      echo "Note: Consider adding 'use client' directive for client components"
    fi
  fi
fi

exit 0
