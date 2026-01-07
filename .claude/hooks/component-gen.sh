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

  # 提取组件名（将 kebab-case 转换为 PascalCase）
  component_name=$(basename "$file_path" .tsx | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1' | tr -d ' ')
  component_filename=$(basename "$file_path" .tsx)

  # 提取目录路径
  component_dir=$(dirname "$file_path")

  # 检查是否是 ui 组件
  is_ui_component=false
  if echo "$file_path" | grep -qE 'components/ui/'; then
    is_ui_component=true
  fi

  # 根据组件类型生成不同的模板
  if [ "$is_ui_component" = true ]; then
    # UI 组件模板（基于 shadcn/ui 模式）
    cat > "$file_path" << EOF
import * as React from "react"

import { cn } from "@/lib/utils"

export interface ${component_name}Props
  extends React.HTMLAttributes<HTMLDivElement> {
  // Add props here
}

const ${component_name} = React.forwardRef<HTMLDivElement, ${component_name}Props>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          " rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      />
    )
  }
)
${component_name}.displayName = "${component_name}"

export { ${component_name} }
EOF
    echo "✓ Generated UI component template: $component_name"

  else
    # 通用组件模板
    cat > "$file_path" << EOF
'use client'

import { cn } from '@/lib/utils'

interface ${component_name}Props {
  className?: string
}

export function ${component_name}({ className }: ${component_name}Props) {
  return (
    <div className={cn('', className)}>
      {/* Component content */}
    </div>
  )
}
EOF
    echo "✓ Generated component template: $component_name"
  fi
else
  echo "Skipping template generation for non-component file: $file_path"
fi

exit 0
