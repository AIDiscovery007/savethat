---
name: npm-dep-resolver
description: "解决 npm 依赖包冲突的标准化流程。使用场景：(1) 安装依赖时出现 peer dependency 警告，(2) React 19 与旧版包的兼容性问题，(3) 版本冲突导致安装失败，(4) 需要永久配置 legacy-peer-deps。"
---

# npm 依赖冲突解决 SOP

## 快速开始

```bash
# 1. 先运行 install 查看冲突
npm install

# 2. 如果有警告，使用 legacy-peer-deps 重新安装
npm install --legacy-peer-deps

# 3. 创建 .npmrc 永久配置
echo "legacy-peer-deps=true" > .npmrc

# 4. 再次验证
npm install
```

## 常见冲突场景

### 1. React 19 兼容性问题

**症状：**
```
npm warn Found: react@19.2.3
npm warn peer react@"^16.8 || ^17 || ^18" from @emoji-mart/react@1.1.1
npm warn Conflicting peer dependency: react@18.3.1
```

**解决方案：**
```bash
# 临时方案
npm install --legacy-peer-deps

# 永久方案 - 创建 .npmrc
echo "legacy-peer-deps=true" >> .npmrc
npm install
```

### 2. 特定包版本冲突

**解决方案：使用 overrides**

在 `package.json` 中添加：
```json
{
  "overrides": {
    "package-name": {
      "dependency-name": "$dependency-name"
    }
  }
}
```

示例 - 覆盖嵌套依赖版本：
```json
{
  "overrides": {
    "foo": {
      "bar": "2.0.0"
    }
  }
}
```

### 3. 强制安装（不推荐）

```bash
npm install --force
# 或
npm install --force --legacy-peer-deps
```

⚠️ **警告**: `--force` 会覆盖所有版本约束，可能导致运行时错误。

## 诊断工具

### 查看依赖树
```bash
# 扁平化视图
npm list --depth=0

# 完整树
npm list --all

# 查看特定包
npm list <package-name>
```

### 检查过时的包
```bash
npm outdated
```

### 检查重复依赖
```bash
npm dedup
```

## 工作流检查清单

- [ ] 运行 `npm install` 识别冲突
- [ ] 使用 `--legacy-peer-deps` 临时解决
- [ ] 验证项目可以正常构建 (`npm run build`)
- [ ] 创建 `.npmrc` 永久配置
- [ ] 提交 `.npmrc` 到版本控制
- [ ] 通知团队成员配置已更新

## 相关命令速查

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm install --legacy-peer-deps` | 跳过严格 peer 检查 |
| `npm dedup` | 移除重复依赖 |
| `npm audit` | 安全审计 |
| `npm ci` | 干净安装（根据 lockfile） |
| `rm -rf node_modules && npm install` | 彻底重装 |

## Context7 最佳实践

参考 [npm 官方文档](https://github.com/context7/npmjs/blob/main/cli/v8/configuring-npm/package-json.md)：

- **`overrides`**: 用于覆盖直接依赖和传递依赖的版本
- **`peerDependencies`**: 声明与主包的兼容性
- **`legacy-peer-deps`**: npm v7+ 默认安装 peer deps，旧行为需手动启用

## 故障排除

### 安装后仍有问题
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 彻底重装
rm -rf node_modules package-lock.json
npm install
```

### 特定包无法安装
```bash
# 查看详细日志
npm install -verbose

# 或使用
npm install --debug
```
