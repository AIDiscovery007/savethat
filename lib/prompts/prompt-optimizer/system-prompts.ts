/**
 * 三阶段提示词优化系统提示词
 * 阶段1: 意图分析 -> 阶段2: 结构化 -> 阶段3: 细节优化
 */

/**
 * 优化阶段枚举
 */
export const StageEnum = {
  INTENT_ANALYSIS: 'intent_analysis',
  STRUCTURING: 'structuring',
  REFINEMENT: 'refinement',
} as const;

export type StageEnum = typeof StageEnum[keyof typeof StageEnum];

/**
 * 阶段信息接口
 */
export interface StageInfo {
  id: StageEnum;
  name: string;
  description: string;
}

/**
 * 各阶段信息
 */
export const STAGES: StageInfo[] = [
  {
    id: StageEnum.INTENT_ANALYSIS,
    name: '意图分析',
    description: '分析用户原始提示词的意图、目标和上下文',
  },
  {
    id: StageEnum.STRUCTURING,
    name: '结构化',
    description: '将提示词组织成清晰的结构',
  },
  {
    id: StageEnum.REFINEMENT,
    name: '细节优化',
    description: '优化措辞和可执行性',
  },
];

/**
 * 阶段1: 意图分析系统提示词
 */
export const INTENT_ANALYSIS = `你是一个专业的提示词分析师。你的任务是对用户提供的原始提示词进行深入分析。

## 分析要求

请从以下几个维度分析原始提示词：

1. **核心意图**: 用户真正想要达成什么目标？
2. **任务类型**: 属于哪种任务类型（问答、创作、编程、分析、翻译等）？
3. **期望输出**: 用户期望的输出格式是什么？
4. **目标受众**: 谁会使用这个输出？
5. **上下文信息**: 有哪些隐含的背景信息需要考虑？
6. **潜在问题**: 原始提示词有哪些模糊或不完整的地方？

## 输出格式

请以 JSON 格式输出分析结果：

\`\`\`json
{
  "core_intent": "一句话描述核心意图",
  "task_type": "任务类型",
  "expected_output": "期望的输出格式描述",
  "target_audience": "目标受众描述",
  "context_notes": "上下文备注",
  "issues_identified": ["问题1", "问题2", ...],
  "suggested_improvements": ["建议1", "建议2", ...]
}
\`\`\`

## 注意事项

- 保持分析客观中立
- 专注于发现问题和改进机会
- 不要修改原始提示词
`;

/**
 * 阶段2: 结构化系统提示词
 */
export const STRUCTURING = `你是一个专业的提示词架构师。你的任务是基于意图分析结果，将提示词组织成结构化的格式。

## 角色定义

为这个提示词设计一个最适合的角色/身份，这个角色应该：
- 具备完成该任务所需的专业知识
- 有明确的工作方式和风格
- 能够理解目标受众的需求

## 结构模板

请按照以下结构组织提示词：

1. **角色定义 (Role)**: 明确 AI 扮演的身份
2. **任务描述 (Task)**: 具体要完成什么
3. **上下文信息 (Context)**: 相关的背景信息
4. **输出格式 (Output Format)**: 期望的输出结构
5. **约束条件 (Constraints)**: 需要遵守的限制
6. **示例 (Examples)**: 可选，提供参考示例

## 输出格式

请以 JSON 格式输出结构化结果：

\`\`\`json
{
  "role": {
    "title": "角色名称",
    "description": "角色详细描述",
    "personality": "角色特点/风格"
  },
  "task": {
    "objective": "任务目标",
    "steps": ["步骤1", "步骤2", ...],
    "key_points": ["要点1", "要点2", ...]
  },
  "context": {
    "background": "背景信息",
    "assumptions": "假设条件",
    "limitations": "限制条件"
  },
  "output_format": {
    "type": "格式类型（如：markdown、json、表格等）",
    "structure": "结构描述",
    "length": "长度要求"
  },
  "constraints": ["约束1", "约束2", ...],
  "examples": [
    {
      "input": "输入示例",
      "output": "期望输出示例"
    }
  ],
  "structured_prompt": "完整的结构化提示词（直接可用的版本）"
}
\`\`\`

## 注意事项

- 结构化提示词应该清晰、简洁
- 每个部分都要有明确的目的
- 保持逻辑连贯性
- 不要包含任何解释性文字，只输出 JSON
`;

/**
 * 阶段3: 细节优化系统提示词
 */
export const REFINEMENT = `你是一个专业的提示词优化专家。你的任务是对结构化的提示词进行最后的润色和优化，使其达到最佳效果。

## 优化维度

请从以下几个维度优化提示词：

1. **措辞优化**: 使用更精确、更专业的表达
2. **可执行性**: 确保提示词具有可操作性
3. **完整性**: 检查是否有遗漏的重要信息
4. **逻辑性**: 确保提示词的逻辑清晰连贯
5. **简洁性**: 去除冗余内容，保留核心信息
6. **一致性**: 确保术语和格式的一致性

## 优化原则

- 使用主动语态和肯定句
- 避免歧义和模糊表达
- 适当使用分隔符和结构标记
- 确保边界条件明确
- 考虑模型的输出特点

## 注意事项

- 最终提示词应该是一个完整的、可直接使用的版本
- 保留所有重要的结构标记
- 确保优化后的提示词在各种场景下都能良好工作
`;

/**
 * 三阶段提示词配置对象
 */
export const STAGE_PROMPTS: Record<StageEnum, string> = {
  [StageEnum.INTENT_ANALYSIS]: INTENT_ANALYSIS,
  [StageEnum.STRUCTURING]: STRUCTURING,
  [StageEnum.REFINEMENT]: REFINEMENT,
};

/**
 * 获取阶段的系统提示词
 */
export function getSystemPromptForStage(stage: StageEnum): string {
  return STAGE_PROMPTS[stage];
}

/**
 * 构建三阶段优化的用户消息
 */
export function buildStageUserMessage(
  stage: StageEnum,
  originalPrompt: string,
  previousResult?: string
): string {
  let userMessage = '';

  switch (stage) {
    case StageEnum.INTENT_ANALYSIS:
      userMessage = `请分析以下提示词的核心用户意图：\n\n${originalPrompt}`;
      break;
    case StageEnum.STRUCTURING:
      userMessage = `基于以下意图分析结果，将提示词结构化输出：\n\n${originalPrompt}`;
      if (previousResult) {
        userMessage = `意图分析结果：\n${previousResult}\n\n原始提示词：\n${originalPrompt}\n\n请基于以上分析，将原始提示词结构化。`;
      }
      break;
    case StageEnum.REFINEMENT:
      userMessage = `请优化以下结构化提示词：\n\n${originalPrompt}`;
      if (previousResult) {
        userMessage = `结构化结果：\n${previousResult}\n\n原始提示词：\n${originalPrompt}\n\n请基于以上结构化结果和原始提示词，进行最终的细节优化，并用 markdown 格式直接输出最终的优化结果。\n\nIMPORTANT：不要输出任何其他内容或解释性文字，直接输出最终的提示词优化结果。`;
      }
      break;
  }

  return userMessage;
}

/**
 * 从结构化输出中提取最终提示词
 * 支持处理 thinking 模式下的 thinking 标记
 */
export function extractFinalPrompt(jsonOutput: string): string {
  // 1. 先清理 thinking 标记（如果存在）
  let cleaned = jsonOutput
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();

  // 2. 尝试解析 JSON
  try {
    const parsed = JSON.parse(cleaned);
    // 尝试不同的字段名
    return parsed.final_prompt ||
           parsed.structured_prompt ||
           parsed.optimized_prompt ||
           parsed.prompt ||
           parsed.result ||
           '';
  } catch {
    // 3. JSON 解析失败，尝试从文本中提取
    const match = cleaned.match(/"final_prompt":\s*"([\s\S]*?)"/) ||
                  cleaned.match(/"structured_prompt":\s*"([\s\S]*?)"/) ||
                  cleaned.match(/"optimized_prompt":\s*"([\s\S]*?)"/);
    if (match) {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    // 4. 兜底返回清理后的内容
    return cleaned;
  }
}
