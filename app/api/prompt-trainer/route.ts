/**
 * 提问训练工具 API
 * 提供对话引导、问题优化和结果对比功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { aihubmixClient } from '@/lib/api/aihubmix/client';
import { DEFAULT_MODEL_ID } from '@/lib/api/aihubmix/models';

// 场景类型
type Scenario = 'learning' | 'work' | 'life';

// 引导问题配置
interface GuidanceQuestion {
  id: string;
  text: string;
  options?: string[];
  type: 'clarify' | 'quantify' | 'limit' | 'background' | 'constraint';
}

// 场景引导配置
const SCENARIO_GUIDANCE: Record<Scenario, GuidanceQuestion[]> = {
  learning: [
    { id: 'subject', text: '是哪个学科或领域？', options: ['数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '政治', '其他'], type: 'clarify' },
    { id: 'level', text: '你目前的学习水平是？', options: ['基础薄弱', '中等水平', '较好', '优秀'], type: 'clarify' },
    { id: 'goal', text: '你想达到什么目标？', options: ['提高分数', '掌握概念', '准备考试', '竞赛获奖', '培养兴趣'], type: 'clarify' },
    { id: 'specific', text: '有没有具体薄弱环节？', options: ['基础知识', '解题技巧', '综合应用', '都不清楚'], type: 'clarify' },
  ],
  work: [
    { id: 'context', text: '你遇到的是什么类型的工作问题？', options: ['项目管理', '技术开发', '数据分析', '文档写作', '沟通协作', '其他'], type: 'clarify' },
    { id: 'background', text: '能简单描述一下背景吗？', type: 'background' },
    { id: 'goal', text: '你希望达成什么结果？', type: 'clarify' },
    { id: 'constraint', text: '有什么时间或资源限制吗？', type: 'constraint' },
  ],
  life: [
    { id: 'area', text: '是哪个方面的问题？', options: ['健康', '人际关系', '财务', '兴趣爱好', '时间管理', '其他'], type: 'clarify' },
    { id: 'background', text: '能描述一下具体情况吗？', type: 'background' },
    { id: 'goal', text: '你希望改善到什么程度？', type: 'quantify' },
  ],
};

// --- 简化的辅助函数 ---

/** 解析 AI 响应内容 */
const getContent = (response: { choices?: Array<{ message?: { content?: string } }> }) =>
  response.choices?.[0]?.message?.content || '';

/** 通用 AI 调用 */
const chat = (prompt: string, model: string, options: { temp?: number; tokens?: number } = {}) =>
  aihubmixClient.chat({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temp ?? 0.5,
    max_tokens: options.tokens ?? 200,
  });

/** 格式化对话历史 */
const formatHistory = (context: Array<{ question: string; answer: string }>) =>
  context.map(c => `问：${c.question}\n答：${c.answer}`).join('\n');

// 估计轮次的提示词
function getEstimationPrompt(scenario: Scenario): string {
  const count = SCENARIO_GUIDANCE[scenario].length;
  return `用户场景：${scenario}
预设引导问题数量：${count}个

请根据问题的复杂程度估算需要的对话轮次：
- 简单问题：2-3轮
- 中等问题：3-4轮
- 复杂问题：4-5轮

请只返回一个数字（2-5），代表预估轮次。`;
}

// 生成引导问题的提示词
function getGuidancePrompt(
  scenario: Scenario,
  originalQuestion: string,
  context: Array<{ question: string; answer: string }>,
  maxRounds: number
): string {
  if (context.length >= maxRounds) return '';

  const answeredIds = context.map(c => {
    const match = c.question.match(/是(.+?)？/);
    return match?.[1];
  }).filter(Boolean);

  const nextQuestion = SCENARIO_GUIDANCE[scenario].find(g =>
    !answeredIds.includes(g.text.replace(/是|？/g, ''))
  );

  if (!nextQuestion) return '';

  return `你是提问训练助手，帮助用户学会提出更好的问题。

用户场景：${scenario}
原始问题：${originalQuestion}
当前轮次：${context.length + 1}/${maxRounds}
剩余可问问题数：${maxRounds - context.length}

对话历史：
${formatHistory(context)}

请根据以上信息，生成下一个引导问题。要求：
1. 简洁明了，让用户容易理解
2. 不要重复已经问过的问题
3. 如果是选择题，提供2-4个选项
4. 如果是开放题，用简洁的语言提问
5. **重要：如果剩余问题<=2，请直接生成最终问题，不要再追问**

${
  nextQuestion.options
    ? `请用以下格式返回（不要修改问题内容）：

Q: ${nextQuestion.text}
OPTIONS: ${nextQuestion.options.join(',')}`
    : `请用以下格式返回：

Q: ${nextQuestion.text}`
}`;
}

// 生成优化问题的提示词
function getOptimizationPrompt(
  scenario: Scenario,
  originalQuestion: string,
  context: Array<{ question: string; answer: string }>
): string {
  return `你是提问优化专家。请将用户的原始问题根据对话内容优化成一个高质量问题。

用户场景：${scenario}
原始问题：${originalQuestion}

对话历史：
${formatHistory(context)}

请生成一个优化后的问题，要求：
1. 具体明确，包含所有关键信息
2. 包含背景、目标、约束条件等
3. 能够直接用来询问AI并获得高质量回答
4. 语言自然流畅

请直接返回优化后的问题，不要添加任何解释。`;
}

// 比较两个问题获得回答的提示词
function getComparisonPrompt(question: string): string {
  return `请用简洁的语言回答这个问题（50字以内）：

${question}

只返回回答内容，不需要任何额外说明。`;
}

/** 生成解释 */
const generateExplanation = async (model: string, original: string, optimized: string) => {
  const prompt = `请解释为什么优化后的问题比原始问题更好。

原始问题：${original}
优化后的问题：${optimized}

请从以下角度简要说明（1-2句话）：
1. 优化后的问题添加了什么关键信息？
2. 这样提问为什么能获得更好的AI回答？

请直接返回解释文本，用换行分隔不同角度。`;

  return getContent(await chat(prompt, model, { temp: 0.3, tokens: 100 }));
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, scenario, originalQuestion, context = [], optimizedQuestion, modelId } = body;
    const model = modelId || DEFAULT_MODEL_ID;

    switch (action) {
      case 'estimate-rounds': {
        const response = await chat(getEstimationPrompt(scenario), model, { temp: 0.3, tokens: 10 });
        const rounds = parseInt(getContent(response), 10);
        return NextResponse.json({ estimatedRounds: Math.min(5, Math.max(2, rounds)) });
      }

      case 'guidance': {
        const maxRounds = body.maxRounds || 3;
        const prompt = getGuidancePrompt(scenario, originalQuestion, context, maxRounds);

        if (!prompt) {
          const optimized = getContent(await chat(getOptimizationPrompt(scenario, originalQuestion, context), model, { tokens: 300 }));
          return NextResponse.json({
            isComplete: true,
            optimizedQuestion: optimized,
            explanation: await generateExplanation(model, originalQuestion, optimized),
          });
        }

        const content = getContent(await chat(prompt, model, { tokens: 200 }));
        const qMatch = content.match(/^Q:\s*(.+)$/m);
        const optionsMatch = content.match(/OPTIONS:\s*(.+)$/);

        return NextResponse.json({
          isComplete: false,
          question: qMatch ? qMatch[1].trim() : content,
          options: optionsMatch ? optionsMatch[1].split(',').map(o => o.trim()) : undefined,
        });
      }

      case 'optimize': {
        const optimized = getContent(await chat(getOptimizationPrompt(scenario, originalQuestion, context), model, { tokens: 300 }));
        return NextResponse.json({
          optimizedQuestion: optimized,
          explanation: await generateExplanation(model, originalQuestion, optimized),
        });
      }

      case 'compare': {
        const [original, optimized] = await Promise.all([
          chat(getComparisonPrompt(originalQuestion), model, { tokens: 100 }),
          chat(getComparisonPrompt(optimizedQuestion), model, { tokens: 100 }),
        ]);
        return NextResponse.json({
          originalAnswer: getContent(original),
          optimizedAnswer: getContent(optimized),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[PromptTrainer] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}

// GET 方法返回 API 信息
export async function GET() {
  return NextResponse.json({
    name: 'Prompt Trainer API',
    description: 'AI-powered question training tool',
    endpoint: '/api/prompt-trainer',
    method: 'POST',
    actions: {
      'estimate-rounds': '估算对话轮次',
      'guidance': '生成引导问题',
      'optimize': '直接优化问题',
      'compare': '对比两个问题的AI回答',
    },
  });
}
