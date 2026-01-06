import type { AnalysisTemplateItem, NoteData } from '@/types/xiaohongshu';

/**
 * 预设分析模板列表
 */
export const ANALYSIS_TEMPLATES: AnalysisTemplateItem[] = [
  {
    id: 'viral-features',
    name: '爆款笔记特征分析',
    description: '分析高互动笔记的共同特征，找出爆款规律',
    prompt: '请分析这些笔记数据，找出高互动（点赞、评论、收藏）笔记的共同特征，包括：1）标题特点 2）内容模式 3）发布时间规律 4）标签使用技巧 5）互动率差异分析',
  },
  {
    id: 'content-optimization',
    name: '内容优化建议',
    description: '基于数据分析提供具体的内容优化方向',
    prompt: '请根据笔记数据提供具体的内容优化建议，包括：1）哪些类型的内容表现更好 2）标题和封面的优化方向 3）内容长度与互动率的关系 4）最佳内容创作策略',
  },
  {
    id: 'publishing-time',
    name: '发布时间分析',
    description: '分析最佳发布时间段',
    prompt: '请分析发布时间与互动效果的关系，找出最佳发布时间段，包括：1）一周中哪几天表现更好 2）一天中什么时间段发布效果最佳 3）工作日与周末的差异',
  },
  {
    id: 'engagement-improvement',
    name: '互动率提升策略',
    description: '提供提升笔记互动率的实用策略',
    prompt: '请基于数据分析提供提升笔记互动率的实用策略，包括：1）如何提升点赞量 2）如何增加评论互动 3）如何提高收藏率 4）如何促进分享传播',
  },
];

/**
 * 构建分析提示词
 * @param data - 笔记数据
 * @param instruction - 用户自定义指令
 * @param template - 预设模板
 * @returns 完整的提示词
 */
export function buildAnalysisPrompt(
  data: NoteData[],
  instruction: string,
  template?: string
): string {
  // 取前 50 条数据进行示例分析，避免过长
  const sampleData = data.slice(0, 50);

  // 数据概览
  const totalNotes = data.length;
  const totalViews = data.reduce((sum, n) => sum + (n.views || 0), 0);
  const totalLikes = data.reduce((sum, n) => sum + (n.likes || 0), 0);
  const totalComments = data.reduce((sum, n) => sum + (n.comments || 0), 0);
  const totalShares = data.reduce((sum, n) => sum + (n.shares || 0), 0);
  const avgEngagementRate = totalViews > 0
    ? (((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(2)
    : '0';

  const dataOverview = `
## 数据概览
- 笔记总数: ${totalNotes} 篇
- 总曝光量: ${totalViews.toLocaleString()}
- 总点赞数: ${totalLikes.toLocaleString()}
- 总评论数: ${totalComments.toLocaleString()}
- 总分享数: ${totalShares.toLocaleString()}
- 平均互动率: ${avgEngagementRate}%
`;

  // 示例数据（格式化后）
  const sampleDataStr = JSON.stringify(sampleData, null, 2);

  return `你是一位专业的小红书数据分析师，请对以下笔记数据进行深入分析。

### 分析指令
${instruction}
${template ? `\n### 预设分析模板\n${template}` : ''}

${dataOverview}

### 样本数据（前 50 条）
${sampleDataStr}

### 输出要求
请输出详细的分析报告，包括：
1. **数据洞察** - 从数据中发现的关键规律和异常
2. **具体建议** - 可执行的内容优化建议
3. **行动计划** - 后续创作的具体计划建议

请使用 Markdown 格式输出，确保内容专业、准确、有价值。`;
}

/**
 * 获取默认指令
 * @param templateId - 模板 ID
 * @returns 默认指令
 */
export function getDefaultInstruction(templateId: string): string {
  const template = ANALYSIS_TEMPLATES.find(t => t.id === templateId);
  return template?.prompt || '';
}
