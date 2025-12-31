'use client';

/**
 * 提示词优化流程 Hook
 * 实现三阶段顺序优化逻辑
 */

import { useState, useCallback } from 'react';
import type { OptimizationHistory, OptimizationStageResult } from '@/lib/storage/types';
import {
  STAGES,
  OptimizationStage,
  getSystemPromptForStage,
  buildStageUserMessage,
  extractFinalPrompt,
} from '@/lib/prompts/prompt-optimizer/system-prompts';
import type { AihubmixMessage } from '@/lib/api/aihubmix/types';

/**
 * 优化状态接口
 */
export interface OptimizationState {
  isOptimizing: boolean;
  currentStage: OptimizationStage | null;
  stageProgress: number; // 0-100
  stages: OptimizationStageResult[];
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
  stages: OptimizationStageResult[];
  totalDuration: number;
}

/**
 * API 调用选项
 */
interface ApiCallOptions {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
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

  /**
   * 调用 API 进行单阶段优化
   */
  const callStageApi = async (
    stage: OptimizationStage,
    messages: AihubmixMessage[],
    options: ApiCallOptions
  ): Promise<OptimizationStageResult> => {
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
    onStageChange?: (stage: OptimizationStage, progress: number) => void
  ): Promise<OptimizationResult | null> => {
    // 重置状态
    setState({
      isOptimizing: true,
      currentStage: OptimizationStage.INTENT_ANALYSIS,
      stageProgress: 0,
      stages: [],
      result: null,
      error: null,
    });

    const startTime = Date.now();
    const stageResults: OptimizationStageResult[] = [];

    try {
      // 阶段 1: 意图分析
      setState(s => ({ ...s, currentStage: OptimizationStage.INTENT_ANALYSIS, stageProgress: 10 }));
      onStageChange?.(OptimizationStage.INTENT_ANALYSIS, 10);

      const intentMessage = buildStageUserMessage(OptimizationStage.INTENT_ANALYSIS, originalPrompt);
      const intentResult = await callStageApi(
        OptimizationStage.INTENT_ANALYSIS,
        [{ role: 'user', content: intentMessage }],
        { modelId }
      );
      stageResults.push(intentResult);
      setState(s => ({ ...s, stages: stageResults, stageProgress: 33 }));

      // 阶段 2: 结构化
      setState(s => ({ ...s, currentStage: OptimizationStage.STRUCTURING, stageProgress: 33 }));
      onStageChange?.(OptimizationStage.STRUCTURING, 33);

      const structMessage = buildStageUserMessage(
        OptimizationStage.STRUCTURING,
        originalPrompt,
        intentResult.output
      );
      const structResult = await callStageApi(
        OptimizationStage.STRUCTURING,
        [{ role: 'user', content: structMessage }],
        { modelId }
      );
      stageResults.push(structResult);
      setState(s => ({ ...s, stages: stageResults, stageProgress: 66 }));

      // 阶段 3: 细节优化
      setState(s => ({ ...s, currentStage: OptimizationStage.REFINEMENT, stageProgress: 66 }));
      onStageChange?.(OptimizationStage.REFINEMENT, 66);

      const refineMessage = buildStageUserMessage(
        OptimizationStage.REFINEMENT,
        originalPrompt,
        structResult.output
      );
      const refineResult = await callStageApi(
        OptimizationStage.REFINEMENT,
        [{ role: 'user', content: refineMessage }],
        { modelId }
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

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(s => ({
        ...s,
        isOptimizing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
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
