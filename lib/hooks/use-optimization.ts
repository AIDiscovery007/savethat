'use client';

/**
 * 提示词优化流程 Hook
 * 实现三阶段顺序优化逻辑
 */

import { useState, useCallback, useEffect } from 'react';
import type { OptimizationStage } from '@/lib/storage/types';
import {
  STAGES,
  StageEnum,
  getSystemPromptForStage,
  buildStageUserMessage,
  extractFinalPrompt,
} from '@/lib/prompts/prompt-optimizer/system-prompts';
import type { AihubmixMessage } from '@/lib/api/aihubmix/types';
import { callAihubmixFull, extractContent } from './use-aihubmix';
import { useLocalStorage, getStorageItem } from './use-local-storage';

/**
 * 存储键名
 */
const DRAFT_RESULT_KEY = 'prompt_optimizer_draft_result';

/**
 * 阶段进度配置
 */
const STAGE_PROGRESS: Record<StageEnum, { current: number; next: number }> = {
  [StageEnum.INTENT_ANALYSIS]: { current: 10, next: 33 },
  [StageEnum.STRUCTURING]: { current: 33, next: 66 },
  [StageEnum.REFINEMENT]: { current: 66, next: 100 },
} as const;

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

  // 使用 useLocalStorage 管理草稿结果
  const [draftResult, setDraftResult, removeDraftResult] = useLocalStorage<OptimizationResult | null>(
    DRAFT_RESULT_KEY,
    null
  );

  // 在客户端渲染后恢复草稿结果（避免水合问题）
  useEffect(() => {
    const savedDraft = getStorageItem<OptimizationResult | null>(DRAFT_RESULT_KEY, null);
    if (savedDraft) {
      setState({
        isOptimizing: false,
        currentStage: null,
        stageProgress: 100,
        stages: savedDraft.stages,
        result: savedDraft,
        error: null,
      });
    }
  }, []);

  /**
   * 调用 API 进行单阶段优化
   */
  const callStageApi = useCallback(
    async (
      stage: StageEnum,
      messages: AihubmixMessage[],
      options: ApiCallOptions
    ): Promise<OptimizationStage> => {
      const systemPrompt = getSystemPromptForStage(stage);

      const data = await callAihubmixFull<any>({
        model: options.modelId,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 4096,
        thinking: options.thinking,
      });

      const content = extractContent(data);

      return {
        id: `${stage}-${Date.now()}`,
        name: STAGES.find(s => s.id === stage)?.name || stage,
        description: STAGES.find(s => s.id === stage)?.description || '',
        input: messages[messages.length - 1]?.content || '',
        output: content,
        tokens: data.usage
          ? {
              prompt: data.usage.prompt_tokens,
              completion: data.usage.completion_tokens,
              total: data.usage.total_tokens,
            }
          : undefined,
        createdAt: new Date().toISOString(),
      };
    },
    []
  );

  /**
   * 执行优化流程
   */
  const optimize = useCallback(
    async (
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

      const STAGES_ORDER = [
        StageEnum.INTENT_ANALYSIS,
        StageEnum.STRUCTURING,
        StageEnum.REFINEMENT,
      ] as const;

      try {
        let previousOutput: string | undefined;

        // 顺序执行三个阶段
        for (const stage of STAGES_ORDER) {
          const progress = STAGE_PROGRESS[stage];

          // 更新状态：当前阶段和进度
          setState(s => ({ ...s, currentStage: stage, stageProgress: progress.current }));
          onStageChange?.(stage, progress.current);

          // 构建消息：使用原始提示词和前一阶段的输出
          const message = buildStageUserMessage(stage, originalPrompt, previousOutput);
          const result = await callStageApi(
            stage,
            [{ role: 'user', content: message }],
            apiOptions
          );

          stageResults.push(result);
          previousOutput = result.output;

          // 更新状态：累积结果和下一阶段进度
          setState(s => ({ ...s, stages: stageResults, stageProgress: progress.next }));
        }

        // 提取最终优化后的提示词
        const optimizedPrompt = extractFinalPrompt(previousOutput!);

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
        setDraftResult(result);

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(s => ({
          ...s,
          isOptimizing: false,
          error: errorMessage,
        }));
        // 清除保存的草稿
        removeDraftResult();
        return null;
      }
    },
    [callStageApi, setDraftResult, removeDraftResult]
  );

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    // 清除保存的草稿
    removeDraftResult();
    setState({
      isOptimizing: false,
      currentStage: null,
      stageProgress: 0,
      stages: [],
      result: null,
      error: null,
    });
  }, [removeDraftResult]);

  return {
    ...state,
    optimize,
    reset,
  };
}
