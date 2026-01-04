#!/bin/bash
# npm 依赖冲突自动诊断与解决脚本

set -e

echo "=== npm 依赖冲突诊断工具 ==="
echo ""

# 检查是否在 npm 项目中
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json，不是 npm 项目"
    exit 1
fi

echo "📦 第 1 步: 运行 npm install 查看冲突..."
npm install 2>&1 | grep -E "(warn|found|audited)" || true

echo ""
echo "🔍 第 2 步: 检查是否有 peer dependency 警告..."

if npm install 2>&1 | grep -q "peer dependency"; then
    echo "⚠️  检测到 peer dependency 冲突"

    # 检查是否已存在 .npmrc
    if [ -f ".npmrc" ]; then
        if grep -q "legacy-peer-deps=true" .npmrc; then
            echo "✅ .npmrc 已配置 legacy-peer-deps"
        else
            echo "⚠️  .npmrc 存在但未配置 legacy-peer-deps"
            read -p "是否添加配置? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "" >> .npmrc
                echo "# Use legacy peer dependency resolution" >> .npmrc
                echo "legacy-peer-deps=true" >> .npmrc
                echo "✅ 已更新 .npmrc"
            fi
        fi
    else
        echo "📝 创建 .npmrc 配置..."
        echo "# Use legacy peer dependency resolution" > .npmrc
        echo "legacy-peer-deps=true" >> .npmrc
        echo "✅ 已创建 .npmrc"
    fi

    echo ""
    echo "🔄 第 3 步: 使用 legacy-peer-deps 重新安装..."
    npm install --legacy-peer-deps

    echo ""
    echo "🧪 第 4 步: 验证安装..."
    if npm install --legacy-peer-deps 2>&1 | grep -q "found 0 vulnerabilities"; then
        echo "✅ 安装成功，无漏洞"
    else
        echo "⚠️  安装完成但可能存在问题，请检查输出"
    fi
else
    echo "✅ 未检测到 peer dependency 冲突"
fi

echo ""
echo "📊 当前依赖状态:"
npm list --depth=0 2>/dev/null | head -20

echo ""
echo "✨ 诊断完成!"
