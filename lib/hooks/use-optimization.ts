'use client';

/**
 * 提示词优化流程 Hook
 * 实现三阶段顺序优化逻辑
 */

import { useState, useCallback, useEffect } from 'react';
import type { OptimizationHistory, OptimizationStage } from '@/lib/storage/types';
import {
  STAGES,
  StageEnum,
  getSystemPromptForStage,
  buildStageUserMessage,
  extractFinalPrompt,
} from '@/lib/prompts/prompt-optimizer/system-prompts';
import type { AihubmixMessage } from '@/lib/api/aihubmix/types';

/**
 * 存储键名
 */
const DRAFT_RESULT_KEY = 'prompt_optimizer_draft_result';

/**
 * 从 localStorage 恢复草稿结果
 */
function restoreDraftResult(): OptimizationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DRAFT_RESULT_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.warn('[useOptimization] Failed to restore draft result');
  }
  return null;
}

/**
 * 保存草稿结果到 localStorage
 */
function saveDraftResult(result: OptimizationResult | null): void {
  if (typeof window === 'undefined') return;
  if (result) {
    localStorage.setItem(DRAFT_RESULT_KEY, JSON.stringify(result));
  } else {
    localStorage.removeItem(DRAFT_RESULT_KEY);
  }
}

/**
 * 优化状态接口
 */
export interface OptimizationState {
  isOptimizing: boolean;
  currentStage: StageEnum | null;
  stageProgress: number; // 0-100
  stages: OptimizationStage[];
  result: OptimizationResult | null;
  error: string | null;
}

/**
 * 优化结果接口
 */
export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  modelId: string;
  modelName: string;
  stages: OptimizationStage[];
  totalDuration: number;
}

/**
 * API 调用选项
 */
interface ApiCallOptions {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  thinking?: boolean;
}

/**
 * 创建优化 Hook
 */
export function useOptimization() {
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    currentStage: null,
    stageProgress: 0,
    stages: [],
    result: null,
    error: null,
  });

  // 在客户端渲染后恢复草稿结果（避免水合问题）
  useEffect(() => {
    const draft = restoreDraftResult();
    if (draft) {
      setState({
        isOptimizing: false,
        currentStage: null,
        stageProgress: 100,
        stages: draft.stages,
        result: draft,
        error: null,
      });
    }
  }, []);

  /**
   * 调用 API 进行单阶段优化
   */
  const callStageApi = async (
    stage: StageEnum,
    messages: AihubmixMessage[],
    options: ApiCallOptions
  ): Promise<OptimizationStage> => {
    const systemPrompt = getSystemPromptForStage(stage);

    const response = await fetch('/api/aihubmix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.thinking && { thinking: true }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Stage ${stage} failed`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return {
      id: `${stage}-${Date.now()}`,
      name: STAGES.find(s => s.id === stage)?.name || stage,
      description: STAGES.find(s => s.id === stage)?.description || '',
      input: messages[messages.length - 1]?.content || '',
      output: content,
      tokens: data.usage ? {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      } : undefined,
      createdAt: new Date().toISOString(),
    };
  };

  /**
   * 执行优化流程
   */
  const optimize = useCallback(async (
    originalPrompt: string,
    modelId: string,
    modelName: string,
    onStageChange?: (stage: StageEnum, progress: number) => void,
    thinkingEnabled?: boolean
  ): Promise<OptimizationResult | null> => {
    // 重置状态
    setState({
      isOptimizing: true,
      currentStage: StageEnum.INTENT_ANALYSIS,
      stageProgress: 0,
      stages: [],
      result: null,
      error: null,
    });

    const startTime = Date.now();
    const stageResults: OptimizationStage[] = [];

    const apiOptions = { modelId, thinking: thinkingEnabled };

    try {
      // 阶段 1: 意图分析
      setState(s => ({ ...s, currentStage: StageEnum.INTENT_ANALYSIS, stageProgress: 10 }));
      onStageChange?.(StageEnum.INTENT_ANALYSIS, 10);

      const intentMessage = buildStageUserMessage(StageEnum.INTENT_ANALYSIS, originalPrompt);
      const intentResult = await callStageApi(
        StageEnum.INTENT_ANALYSIS,
        [{ role: 'user', content: intentMessage }],
        apiOptions
      );
      stageResults.push(intentResult);
      setState(s => ({ ...s, stages: stageResults, stageProgress: 33 }));

      // 阶段 2: 结构化
      setState(s => ({ ...s, currentStage: StageEnum.STRUCTURING, stageProgress: 33 }));
      onStageChange?.(StageEnum.STRUCTURING, 33);

      const structMessage = buildStageUserMessage(
        StageEnum.STRUCTURING,
        originalPrompt,
        intentResult.output
      );
      const structResult = await callStageApi(
        StageEnum.STRUCTURING,
        [{ role: 'user', content: structMessage }],
        apiOptions
      );
      stageResults.push(structResult);
      setState(s => ({ ...s, stages: stageResults, stageProgress: 66 }));

      // 阶段 3: 细节优化
      setState(s => ({ ...s, currentStage: StageEnum.REFINEMENT, stageProgress: 66 }));
      onStageChange?.(StageEnum.REFINEMENT, 66);

      const refineMessage = buildStageUserMessage(
        StageEnum.REFINEMENT,
        originalPrompt,
        structResult.output
      );
      const refineResult = await callStageApi(
        StageEnum.REFINEMENT,
        [{ role: 'user', content: refineMessage }],
        apiOptions
      );
      stageResults.push(refineResult);

      // 提取最终优化后的提示词
      const optimizedPrompt = extractFinalPrompt(refineResult.output);

      const totalDuration = Date.now() - startTime;

      const result: OptimizationResult = {
        originalPrompt,
        optimizedPrompt,
        modelId,
        modelName,
        stages: stageResults,
        totalDuration,
      };

      setState({
        isOptimizing: false,
        currentStage: null,
        stageProgress: 100,
        stages: stageResults,
        result,
        error: null,
      });

      // 保存到 localStorage
      saveDraftResult(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(s => ({
        ...s,
        isOptimizing: false,
        error: errorMessage,
      }));
      // 清除保存的草稿
      saveDraftResult(null);
      return null;
    }
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    // 清除保存的草稿
    saveDraftResult(null);
    setState({
      isOptimizing: false,
      currentStage: null,
      stageProgress: 0,
      stages: [],
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    optimize,
    reset,
  };
}
