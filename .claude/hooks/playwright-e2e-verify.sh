#!/bin/bash
# Playwright E2E 验证自动触发 Hook
# 触发条件: Stop 事件（任务完成时）
# 功能: 自动运行 Playwright 端到端验证

cd "$CLAUDE_PROJECT_DIR"

echo "=== Playwright E2E Verification ==="
echo "Starting end-to-end verification..."

# 检查 Playwright 是否已安装
if ! command -v npx &> /dev/null; then
  echo "❌ npx not found. Skipping E2E verification."
  exit 0
fi

# 检查是否需要启动 dev server
dev_running=false
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "Starting dev server in background..."
  npm run dev > /dev/null 2>&1 &
  dev_pid=$!
  dev_running=true

  # 等待 dev server 启动 (最多 30 秒)
  echo "Waiting for dev server to start..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo "✓ Dev server is ready"
      break
    fi
    sleep 1
  done

  if [ $i -eq 30 ]; then
    echo "❌ Dev server failed to start within 30 seconds"
    exit 1
  fi
else
  echo "✓ Dev server is already running"
fi

# 运行 Playwright E2E 测试
echo ""
echo "Running Playwright E2E tests..."
npx playwright test --project=chromium

test_result=$?

# 清理: 如果是我们启动的 dev server
if [ "$dev_running" = true ]; then
  echo "Stopping dev server..."
  pkill -f "npm run dev" 2>/dev/null || true
fi

if [ $test_result -eq 0 ]; then
  echo "✓ E2E verification completed successfully"
else
  echo "❌ E2E verification failed"
fi

exit $test_result
