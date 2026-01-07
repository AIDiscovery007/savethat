# Prompt Quiz - 改进计划

## 需求变更

1. **模型切换**: 使用 `gemini-2.5-flash` 替代当前默认模型
2. **评判规则**:
   - AI 只输出 **1 个回答**,禁止多个答案变体
   - 改为 **关键词强匹配**,不做语义匹配

## 当前问题

- 当前使用 `gpt-4o-mini` 模型
- 对齐度计算依赖 AI 语义分析,输出啥都判对,失去了训练意义

## 修改计划

### 1. 修改默认模型

**文件**: `lib/api/aihubmix/models.ts`

```typescript
// 第 222 行
export const DEFAULT_MODEL_ID = 'gemini-2.5-flash';
```

### 2. AI 输出改为单回答模式

**文件**: `app/api/tools/prompt-quiz/route.ts`

在 `generate` action 中,修改 AI 调用:

```typescript
case 'generate': {
  // 调用 AI 执行用户的 prompt,强制单回答
  const aiResponse = await aihubmixClient.chat({
    model,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.2, // 低温度,减少随机性
    max_tokens: 300,
  });

  // 强制只取第一个 choice
  const aiOutput = aiResponse.choices?.[0]?.message?.content || '';
  // 如果有多个回答,只取第一行或第一个完整句子
  const singleAnswer = aiOutput.split('\n')[0].trim();
  ...
}
```

### 3. 关键词强匹配逻辑

**文件**: `app/api/tools/prompt-quiz/route.ts`

移除 AI 语义匹配,改为纯关键词匹配:

```typescript
function calculateAlignment(
  aiOutput: string,
  correctAnswer: string,
  keyPoints: string[]
): {
  score: number;
  matchedPoints: string[];
  unmatchedPoints: string[];
} {
  const outputLower = aiOutput.toLowerCase();

  // 纯关键词匹配 (不区分大小写)
  const matched = keyPoints.filter(point => {
    const pointLower = point.toLowerCase();
    // 检查关键词是否出现在输出中
    return outputLower.includes(pointLower);
  });

  const score = keyPoints.length > 0
    ? Math.round((matched.length / keyPoints.length) * 100)
    : 0;

  return {
    score,
    matchedPoints: matched,
    unmatchedPoints: keyPoints.filter(p => !matched.includes(p)),
  };
}
```

### 4. 清理无用代码

删除 `calculateAlignment` 函数中对 AI 调用的依赖,移除 JSON 解析逻辑。

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `lib/api/aihubmix/models.ts` | DEFAULT_MODEL_ID 改为 `gemini-2.5-flash` |
| `app/api/tools/prompt-quiz/route.ts` | AI 输出改为单回答 + 关键词强匹配 |
