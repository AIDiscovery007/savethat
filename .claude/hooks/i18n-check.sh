#!/bin/bash
# i18n 同步检查 Hook
# 触发条件: 修改或新建使用 useTranslations 的文件时检查翻译

cd "$CLAUDE_PROJECT_DIR"

# 从 stdin 读取文件路径
file_path=$(jq -r '.tool_input.file_path' /dev/stdin 2>/dev/null)

if [ -z "$file_path" ] || [ "$file_path" = "null" ]; then
  exit 0
fi

# 检查是否是 TypeScript/TSX 文件且使用了 useTranslations
if echo "$file_path" | grep -qE '\.(ts|tsx)$' && grep -q "useTranslations" "$file_path" 2>/dev/null; then
  echo "Checking i18n sync for: $file_path"

  # 提取 translation namespace
  namespace=$(grep -oP "useTranslations\(['\"](\w+)['\"]\)" "$file_path" | head -1 | sed "s/useTranslations(['\"]//; s/['\"])//")

  if [ -n "$namespace" ]; then
    # 检查 messages 文件是否存在对应的翻译
    en_file="messages/en.json"
    zh_file="messages/zh.json"

    if [ -f "$en_file" ] && [ -f "$zh_file" ]; then
      # 使用 node 检查翻译同步
      node -e "
        const en = require('./$en_file');
        const zh = require('./$zh_file');

        const ns = '$namespace';
        const enKeys = en[ns] ? Object.keys(en[ns]) : [];
        const zhKeys = zh[ns] ? Object.keys(zh[ns]) : [];

        const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
        const missingInEn = zhKeys.filter(k => !enKeys.includes(k));

        if (missingInZh.length > 0) {
          console.log('⚠ Missing in zh.json:', missingInZh.slice(0, 5).join(', '));
        }
        if (missingInEn.length > 0) {
          console.log('⚠ Missing in en.json:', missingInEn.slice(0, 5).join(', '));
        }
        if (missingInZh.length === 0 && missingInEn.length === 0) {
          console.log('✓ i18n keys are synced');
        }
      " 2>/dev/null
    fi
  fi
fi

exit 0
