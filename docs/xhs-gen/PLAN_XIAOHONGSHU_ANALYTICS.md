# 小红书笔记数据分析工具 - 开发计划

## 一、技术架构

### 1.1 技术栈
- **前端框架**: Next.js 16 App Router
- **CSV 解析**: PapaParse (浏览器端解析)
- **AI 集成**: Vercel AI SDK + aihubmix provider
- **UI 组件**: shadcn/ui + Tailwind CSS 4
- **样式**: CSS Variables + Tailwind

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    小红书数据分析工具                         │
├─────────────────────────────────────────────────────────────┤
│  前端层                                                    │
│  ├── CSV 文件上传组件 (Input + PapaParse)                   │
│  ├── 用户指令输入 (Textarea)                                │
│  ├── 数据预览表格 (Table)                                   │
│  ├── 分析报告展示 (Markdown/Rich Text)                      │
│  └── 分析历史列表 (History)                                 │
├─────────────────────────────────────────────────────────────┤
│  API 层                                                    │
│  ├── POST /api/upload     - 接收并解析 CSV                  │
│  ├── POST /api/analyze    - 调用 AI 模型进行数据分析        │
│  └── GET  /api/history    - 获取分析历史                    │
├─────────────────────────────────────────────────────────────┤
│  AI 服务层                                                 │
│  └── aihubmix provider (Vercel AI SDK)                     │
└─────────────────────────────────────────────────────────────┘
```

## 二、核心功能模块

### 2.1 CSV 文件上传与解析
- 支持 `.csv` 文件拖拽上传
- 使用 `Papa.parse()` 在浏览器端解析
- 返回 JSON 格式数据供预览和分析

### 2.2 用户指令输入
- 自然语言指令输入框
- 支持预设分析模板（如"分析爆款笔记特征"）
- 自定义指令支持

### 2.3 AI 数据分析引擎
- 调用 aihubmix 模型进行数据分析
- 支持流式输出展示
- 智能数据洞察生成

### 2.4 分析报告展示
- Markdown 格式渲染
- 关键指标可视化
- 优化建议输出

## 三、开发步骤

### Phase 1: 基础架构 (Day 1)

#### 步骤 1.1: 创建工具注册
**文件**: `lib/tools/registry.ts`
```typescript
// 添加新工具
{
  id: 'xiaohongshu-analytics',
  name: '小红书分析',
  path: 'xiaohongshu-analytics',
  category: 'analytics',
  status: 'experimental',
  description: '小红书笔记数据分析工具，支持 CSV 导入和 AI 智能分析'
}
```

#### 步骤 1.2: 创建页面框架
**文件**: `app/[locale]/tools/xiaohongshu-analytics/page.tsx`
- 页面布局: Header + 主内容区
- 响应式设计
- 国际化支持 (en/zh)

#### 步骤 1.3: 创建类型定义
**文件**: `types/xiaohongshu.ts`
```typescript
export interface NoteData {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  // ... 其他字段
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  metrics: Record<string, number>;
}
```

### Phase 2: CSV 上传功能 (Day 2)

#### 步骤 2.1: 创建上传组件
**文件**: `components/xiaohongshu/csv-uploader.tsx`
- 文件输入框 (拖拽支持)
- 文件类型验证 (.csv)
- 解析进度展示

#### 步骤 2.2: CSV 解析工具
**文件**: `lib/xiaohongshu/parser.ts`
```typescript
import Papa from 'papaparse';

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}
```

#### 步骤 2.3: 数据预览组件
**文件**: `components/xiaohongshu/data-preview.tsx`
- 表格展示解析后的数据
- 分页支持
- 字段筛选

### Phase 3: AI 分析功能 (Day 3-4)

#### 步骤 3.1: AI API 路由
**文件**: `app/api/xiaohongshu/analyze/route.ts`
```typescript
import { aihubmix } from '@aihubmix/ai-sdk-provider';
import { streamText } from 'ai';

export async function POST(request: Request) {
  const { data, instruction } = await request.json();

  const result = streamText({
    model: aihubmix('gpt-4o'), // 或其他模型
    prompt: buildAnalysisPrompt(data, instruction),
  });

  return result.toDataStreamResponse();
}
```

#### 步骤 3.2: 分析提示词模板
**文件**: `lib/xiaohongshu/prompts.ts`
```typescript
export function buildAnalysisPrompt(data: any[], instruction: string): string {
  return `你是一位专业的小红书数据分析师。以下是笔记数据：

${JSON.stringify(data.slice(0, 100), null, 2)}

用户指令: ${instruction}

请进行深入分析，并输出:
1. 数据概览
2. 关键发现
3. 优化建议
4. 可行动项
`;
}
```

#### 步骤 3.3: 流式结果展示
**文件**: `components/xiaohongshu/analysis-result.tsx`
- Markdown 渲染
- 流式打字机效果
- 加载状态动画

### Phase 4: 完善与优化 (Day 5)

#### 步骤 4.1: 预设分析模板
- 爆款笔记特征分析
- 内容优化建议
- 发布时间分析
- 互动率提升策略

#### 步骤 4.2: 数据可视化
- 使用 Recharts 添加图表
- 点赞/评论/收藏趋势图
- 笔记分布热力图

#### 步骤 4.3: 分析历史
- LocalStorage 存储
- 历史记录列表
- 重新分析功能

## 四、文件结构

```
app/[locale]/tools/xiaohongshu-analytics/
├── page.tsx                    # 主页面
└── components/
    ├── csv-uploader.tsx        # CSV 上传组件
    ├── data-preview.tsx        # 数据预览表格
    ├── instruction-input.tsx   # 指令输入框
    ├── analysis-result.tsx     # 分析结果展示
    └── analysis-history.tsx    # 分析历史

lib/xiaohongshu/
├── parser.ts                   # CSV 解析工具
├── prompts.ts                  # AI 提示词模板
├── types.ts                    # 类型定义
└── utils.ts                    # 工具函数

app/api/xiaohongshu/
├── upload/route.ts             # CSV 上传解析 API
└── analyze/route.ts            # AI 分析 API

components/xiaohongshu/         # 共享 UI 组件
```

## 五、API 设计

### 5.1 POST /api/xiaohongshu/upload
**功能**: 解析 CSV 文件
**请求**:
```json
{
  "file": "multipart/form-data"
}
```
**响应**:
```json
{
  "success": true,
  "data": [...],     // 解析后的 JSON 数据
  "columns": [...],  // 列名列表
  "rowCount": 100    // 数据行数
}
```

### 5.2 POST /api/xiaohongshu/analyze
**功能**: AI 数据分析
**请求**:
```json
{
  "data": [...],           // CSV 数据
  "instruction": "分析爆款笔记特征",  // 用户指令
  "model": "gpt-4o"        // 可选: 使用的模型
}
```
**响应**: 流式 SSE 响应

## 六、测试计划

### 6.1 单元测试
- CSV 解析函数测试
- 提示词模板测试
- 工具函数测试

### 6.2 E2E 测试
- 文件上传流程测试
- 完整分析流程测试
- 结果展示验证

## 七、部署注意事项

- 设置 `maxDuration` (如需长时间分析)
- 环境变量: `AIHUBMIX_API_KEY`, `AIHUBMIX_BASE_URL`
- CSV 文件大小限制 (建议 10MB)

## 八、后续扩展

- [ ] 导出分析报告 (PDF/Markdown)
- [ ] 多种图表类型支持
- [ ] 团队协作功能
- [ ] 数据对比分析
- [ ] A/B 测试建议
