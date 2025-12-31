---
name: AI工具聚合站 - 提示词优化工具
overview: 构建一个可扩展的AI工具聚合站，实现第一个工具：基于Gemini 3 Pro的提示词优化工具，支持三阶段优化流程和多模型对比选择。
todos:
  - id: api-types
    content: 创建 Aihubmix API 类型定义 (lib/api/aihubmix/types.ts)
    status: pending
  - id: api-models
    content: 创建模型配置列表 (lib/api/aihubmix/models.ts)
    status: pending
  - id: api-client
    content: 实现 Aihubmix API 客户端封装 (lib/api/aihubmix/client.ts)
    status: pending
    dependencies:
      - api-types
  - id: storage-types
    content: 定义存储数据结构和适配器接口 (lib/storage/types.ts)
    status: pending
  - id: storage-local
    content: 实现本地存储适配器 (lib/storage/local-storage.ts)
    status: pending
    dependencies:
      - storage-types
  - id: system-prompts
    content: 创建三阶段系统提示词 (lib/prompts/prompt-optimizer/system-prompts.ts)
    status: pending
  - id: api-route
    content: 实现 Aihubmix API 代理路由 (app/api/aihubmix/route.ts)
    status: pending
    dependencies:
      - api-client
  - id: optimization-hook
    content: 实现优化流程 Hook (lib/hooks/use-optimization.ts)
    status: pending
    dependencies:
      - api-client
      - system-prompts
  - id: history-hook
    content: 实现历史记录 Hook (lib/hooks/use-history.ts)
    status: pending
    dependencies:
      - storage-local
  - id: model-selector
    content: 创建模型选择器组件 (app/tools/prompt-optimizer/components/model-selector.tsx)
    status: pending
    dependencies:
      - api-models
  - id: optimizer-form
    content: 创建优化表单组件 (app/tools/prompt-optimizer/components/optimizer-form.tsx)
    status: pending
  - id: stage-indicator
    content: 创建阶段指示器组件 (app/tools/prompt-optimizer/components/stage-indicator.tsx)
    status: pending
  - id: optimization-result
    content: 创建优化结果展示组件 (app/tools/prompt-optimizer/components/optimization-result.tsx)
    status: pending
  - id: comparison-view
    content: 创建对比视图组件 (app/tools/prompt-optimizer/components/comparison-view.tsx)
    status: pending
  - id: history-panel
    content: 创建历史记录面板组件 (app/tools/prompt-optimizer/components/history-panel.tsx)
    status: pending
    dependencies:
      - history-hook
  - id: optimizer-page
    content: 集成提示词优化工具页面 (app/tools/prompt-optimizer/page.tsx)
    status: pending
    dependencies:
      - optimization-hook
      - model-selector
      - optimizer-form
      - optimization-result
      - comparison-view
      - history-panel
  - id: home-page
    content: 更新首页为工具导航 (app/page.tsx)
    status: pending
  - id: tool-registry
    content: 创建工具注册表 (lib/tools/registry.ts)
    status: pending
  - id: env-config
    content: 创建 .env.local 配置文件
    status: pending
---

# AI工具聚合

站 - 提示词优化工具实现计划

## 架构概览

```javascript
用户输入 → 三阶段优化流程 → 优化结果展示
         ↓
    Aihubmix API (多模型支持)
         ↓
    本地存储 (可迁移至Supabase)
```



## 项目结构

```javascript
app/
  layout.tsx                          # 更新元数据和导航
  page.tsx                            # 首页：工具导航
  tools/
    prompt-optimizer/
      page.tsx                        # 提示词优化工具主页面
      components/
        optimizer-form.tsx            # 输入表单组件
        optimization-result.tsx       # 结果展示组件
        model-selector.tsx            # 模型选择器组件
        stage-indicator.tsx          # 优化阶段指示器
        comparison-view.tsx           # 原提示词vs优化后对比视图
        history-panel.tsx             # 历史记录面板
  api/
    aihubmix/
      route.ts                        # Aihubmix API 代理路由

lib/
  api/
    aihubmix/
      client.ts                       # Aihubmix API 客户端封装
      types.ts                        # API 类型定义
      models.ts                       # 可用模型列表和配置
  prompts/
    prompt-optimizer/
      system-prompts.ts               # 三阶段系统提示词
  storage/
    local-storage.ts                  # 本地存储实现
    types.ts                          # 存储数据结构（Supabase兼容）
    adapter.ts                        # 存储适配器接口
  tools/
    registry.ts                       # 工具注册表（为未来扩展）
  hooks/
    use-optimization.ts               # 优化流程 Hook
    use-history.ts                    # 历史记录 Hook
```



## 实现步骤

### Phase 1: 基础设施层

#### 1.1 API 客户端封装

- **文件**: `lib/api/aihubmix/types.ts`
- 定义 `AihubmixMessage`, `AihubmixChatRequest`, `AihubmixChatResponse`, `AihubmixStreamChunk` 类型
- **文件**: `lib/api/aihubmix/models.ts`
- 定义 `ModelInfo` 接口
- 创建 `AVAILABLE_MODELS` 数组（包含 gemini-3-pro, gpt-4o, gpt-4o-mini, claude-3.5-sonnet）
- 实现 `getModelById()` 辅助函数
- **文件**: `lib/api/aihubmix/client.ts`
- 实现 `AihubmixClient` 类
- `chat()` 方法：同步调用
- `chatStream()` 方法：流式调用（AsyncGenerator）
- 错误处理和重试逻辑
- 从环境变量读取 `AIHUBMIX_API_KEY` 和 `AIHUBMIX_BASE_URL`

#### 1.2 存储层抽象

- **文件**: `lib/storage/types.ts`
- 定义 `OptimizationHistory` 接口（包含 Supabase 兼容字段：userId?, tags?, isFavorite?）
- 定义 `StorageAdapter` 接口（save, getAll, getById, delete, update）
- **文件**: `lib/storage/local-storage.ts`
- 实现 `LocalStorageAdapter` 类
- 使用 localStorage，限制最多50条记录
- 导出单例 `storageAdapter`

#### 1.3 提示词工程

- **文件**: `lib/prompts/prompt-optimizer/system-prompts.ts`
- 定义三阶段常量：`INTENT_ANALYSIS`, `STRUCTURING`, `REFINEMENT`
- 创建 `STAGE_PROMPTS` 对象，包含每个阶段的系统提示词
- 阶段1：意图分析（输出JSON格式的分析结果）
- 阶段2：结构化处理（角色、任务、上下文、输出格式、约束）
- 阶段3：细节优化（措辞、可执行性、完整性、逻辑性）

### Phase 2: API 路由

#### 2.1 Aihubmix API 代理

- **文件**: `app/api/aihubmix/route.ts`
- 实现 `POST` 方法
- 支持同步和流式响应
- 请求验证（model, messages 必填）
- 错误处理和状态码返回
- 流式响应使用 ReadableStream

### Phase 3: 业务逻辑层

#### 3.1 优化流程 Hook

- **文件**: `lib/hooks/use-optimization.ts`
- 实现 `useOptimization` Hook
- `optimize()` 函数：顺序执行三阶段优化
- 状态管理：`isOptimizing`, `currentStage`
- 每个阶段调用 Aihubmix API
- 返回完整的优化结果（原始、优化后、各阶段结果）

#### 3.2 历史记录 Hook

- **文件**: `lib/hooks/use-history.ts`
- 实现 `useHistory` Hook
- 使用 `storageAdapter` 管理历史记录
- 提供 `save`, `load`, `delete`, `clear` 方法

### Phase 4: UI 组件层

#### 4.1 模型选择器

- **文件**: `app/tools/prompt-optimizer/components/model-selector.tsx`
- 使用 `Select` 或 `Combobox` 组件
- 显示模型名称、描述、提供商
- 支持模型切换

#### 4.2 优化表单

- **文件**: `app/tools/prompt-optimizer/components/optimizer-form.tsx`
- 使用 `Textarea` 组件接收用户输入
- 提交按钮，禁用状态处理
- 表单验证（非空检查）

#### 4.3 阶段指示器

- **文件**: `app/tools/prompt-optimizer/components/stage-indicator.tsx`
- 显示当前优化阶段
- 进度指示（3个阶段）
- 加载动画

#### 4.4 优化结果展示

- **文件**: `app/tools/prompt-optimizer/components/optimization-result.tsx`
- 使用 `Card` 组件展示结果
- 显示优化后的提示词
- 可展开查看各阶段中间结果
- 复制按钮

#### 4.5 对比视图

- **文件**: `app/tools/prompt-optimizer/components/comparison-view.tsx`
- 并排显示原提示词和优化后提示词
- 高亮差异（可选，使用 diff 算法）
- 切换视图模式（并排/单列）

#### 4.6 历史记录面板

- **文件**: `app/tools/prompt-optimizer/components/history-panel.tsx`
- 显示历史优化记录列表
- 点击加载历史记录
- 删除功能
- 使用 `Card` 组件展示

### Phase 5: 页面集成

#### 5.1 提示词优化工具页面

- **文件**: `app/tools/prompt-optimizer/page.tsx`
- 整合所有组件
- 布局：侧边栏（模型选择器+历史记录）+ 主内容区（表单+结果）
- 响应式设计（移动端适配）
- 使用 `useOptimization` 和 `useHistory` Hooks

#### 5.2 首页更新

- **文件**: `app/page.tsx`
- 工具导航卡片
- 展示可用工具列表
- 链接到各个工具页面

#### 5.3 布局更新

- **文件**: `app/layout.tsx`
- 更新 metadata（title, description）
- 添加导航栏（可选）

### Phase 6: 工具注册系统（为未来扩展）

#### 6.1 工具注册表

- **文件**: `lib/tools/registry.ts`
- 定义 `ToolInfo` 接口（id, name, description, path, icon）
- 创建工具注册表
- 注册提示词优化工具
- 提供 `getAllTools()`, `getToolById()` 方法

## 环境变量配置

创建 `.env.local` 文件：

```env
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_BASE_URL=https://aihubmix.com/v1
DEFAULT_MODEL=gemini-3-pro
ENABLE_STREAMING=true
```



## 依赖安装

需要安装的额外依赖：

- `zod`: 数据验证（可选，用于表单验证）

## 数据流

```javascript
用户输入提示词
    ↓
选择模型
    ↓
触发优化 (useOptimization.optimize)
    ↓
阶段1: 意图分析 → Aihubmix API
    ↓
阶段2: 结构化 → Aihubmix API
    ↓
阶段3: 优化 → Aihubmix API
    ↓
保存到历史记录 (storageAdapter.save)
    ↓
展示结果 (OptimizationResult)
```



## 关键设计决策

1. **存储抽象**: 使用适配器模式，便于未来迁移到 Supabase
2. **模型选择**: 用户在前端选择，不限制单一模型
3. **三阶段流程**: 顺序执行，每个阶段依赖前一阶段结果
4. **错误处理**: API 层统一错误处理，UI 层显示友好错误信息
5. **响应式设计**: 移动端优先，使用 Tailwind 响应式类

## 测试要点

1. API 客户端：测试同步和流式调用
2. 存储层：测试本地存储的 CRUD 操作
3. 优化流程：测试三阶段顺序执行
4. UI 组件：测试表单提交、结果展示、历史记录
5. 错误处理：测试 API 错误、网络错误场景

## 后续扩展点

1. 流式响应 UI：实时显示优化进度
2. 多模型对比：同时使用多个模型优化，对比结果
3. 提示词模板库：预设常用提示词模板
4. 导出功能：导出为 Markdown/JSON