'use client';

/**
 * 提问训练工具主页面
 * 帮助用户学会提出更好的问题
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LegoButton } from '@/components/ui/lego-button';
import { PromptInput } from '@/components/prompt-input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Spinner } from '@phosphor-icons/react';
import { CopyButton } from '@/components/copy-button';
import {
  BookOpenIcon,
  BriefcaseIcon,
  HeartIcon,
  SparkleIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
} from '@phosphor-icons/react';

// 场景类型
type Scenario = 'learning' | 'work' | 'life';
type Step = 'scenario' | 'input' | 'dialogue' | 'result';

// 场景配置
const SCENARIOS: Array<{
  id: Scenario;
  label: string;
  icon: React.ReactNode;
  examples: string[];
}> = [
  {
    id: 'learning',
    label: '学习',
    icon: <BookOpenIcon className="h-6 w-6" />,
    examples: ['怎么学好数学？', '如何提高英语口语？', '准备考试时间不够怎么办？'],
  },
  {
    id: 'work',
    label: '工作',
    icon: <BriefcaseIcon className="h-6 w-6" />,
    examples: ['项目延期了怎么办？', '如何提升工作效率？', '和领导沟通有障碍怎么办？'],
  },
  {
    id: 'life',
    label: '生活',
    icon: <HeartIcon className="h-6 w-6" />,
    examples: ['如何养成早起习惯？', '时间管理怎么做？', '想培养新爱好怎么办？'],
  },
];

interface DialogueItem {
  question: string;
  answer: string;
  options?: string[];
}

export default function PromptTrainerPage() {
  const t = useTranslations('PromptTrainer');

  // 状态管理
  const [step, setStep] = React.useState<Step>('scenario');
  const [scenario, setScenario] = React.useState<Scenario | null>(null);
  const [originalQuestion, setOriginalQuestion] = React.useState('');
  const [dialogue, setDialogue] = React.useState<DialogueItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState('');
  const [currentOptions, setCurrentOptions] = React.useState<string[] | undefined>();
  const [estimatedRounds, setEstimatedRounds] = React.useState(3);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [optimizedQuestion, setOptimizedQuestion] = React.useState('');
  const [explanation, setExplanation] = React.useState('');
  const [showComparison, setShowComparison] = React.useState(false);
  const [originalAnswer, setOriginalAnswer] = React.useState('');
  const [optimizedAnswer, setOptimizedAnswer] = React.useState('');

  // 估算轮次
  const estimateRounds = async (selectedScenario: Scenario) => {
    try {
      const response = await fetch('/api/prompt-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'estimate-rounds', scenario: selectedScenario }),
      });
      const data = await response.json();
      setEstimatedRounds(data.estimatedRounds || 3);
    } catch {
      setEstimatedRounds(3);
    }
  };

  // 选择场景
  const handleSelectScenario = async (selectedScenario: Scenario) => {
    setScenario(selectedScenario);
    setStep('input');
    await estimateRounds(selectedScenario);
  };

  // 开始训练
  const handleStartTraining = async () => {
    if (!originalQuestion.trim() || !scenario) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/prompt-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guidance',
          scenario,
          originalQuestion,
          context: dialogue,
          maxRounds: estimatedRounds,
        }),
      });
      const data = await response.json();

      if (data.isComplete) {
        setIsComplete(true);
        setOptimizedQuestion(data.optimizedQuestion);
        setExplanation(data.explanation);
        setStep('result');
      } else {
        setDialogue([...dialogue, { question: data.question, answer: '', options: data.options }]);
        setCurrentQuestion(data.question);
        setCurrentOptions(data.options);
        setStep('dialogue');
      }
    } catch (error) {
      console.error('Failed to start training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 回答问题
  const handleAnswer = async (answer: string) => {
    const newDialogue = [...dialogue];
    newDialogue[newDialogue.length - 1].answer = answer;
    setDialogue(newDialogue);

    setIsLoading(true);
    try {
      const response = await fetch('/api/prompt-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guidance',
          scenario,
          originalQuestion,
          context: newDialogue,
          maxRounds: estimatedRounds,
        }),
      });
      const data = await response.json();

      if (data.isComplete) {
        setIsComplete(true);
        setOptimizedQuestion(data.optimizedQuestion);
        setExplanation(data.explanation);
        setStep('result');
      } else {
        setDialogue([...newDialogue, { question: data.question, answer: '', options: data.options }]);
        setCurrentQuestion(data.question);
        setCurrentOptions(data.options);
      }
    } catch (error) {
      console.error('Failed to continue dialogue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 比较结果
  const handleCompare = async () => {
    setShowComparison(true);
    setIsLoading(true);
    try {
      const response = await fetch('/api/prompt-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          originalQuestion,
          optimizedQuestion,
        }),
      });
      const data = await response.json();
      setOriginalAnswer(data.originalAnswer);
      setOptimizedAnswer(data.optimizedAnswer);
    } catch (error) {
      console.error('Failed to compare:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置
  const handleReset = () => {
    setStep('scenario');
    setScenario(null);
    setOriginalQuestion('');
    setDialogue([]);
    setCurrentQuestion('');
    setCurrentOptions(undefined);
    setIsComplete(false);
    setOptimizedQuestion('');
    setExplanation('');
    setShowComparison(false);
    setOriginalAnswer('');
    setOptimizedAnswer('');
  };

  // 跳过引导直接优化
  const handleSkipGuidance = async () => {
    if (!originalQuestion.trim() || !scenario) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/prompt-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          scenario,
          originalQuestion,
          context: dialogue,
        }),
      });
      const data = await response.json();
      setOptimizedQuestion(data.optimizedQuestion);
      setExplanation(data.explanation);
      setIsComplete(true);
      setStep('result');
    } catch (error) {
      console.error('Failed to optimize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：使用说明 */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <SparkleIcon className="h-5 w-5 text-primary" />
                {t('howItWorks')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">{t('step1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('step1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">{t('step2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('step2Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">{t('step3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('step3Desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 技巧提示 */}
          <Card className="rounded-[var(--radius)] bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <SparkleIcon className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">{t('tipsTitle')}</p>
                  <p>{t('tip1')}</p>
                  <p>{t('tip2')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：主流程 */}
        <div className="lg:col-span-2">
          {/* 场景选择 */}
          {step === 'scenario' && (
            <Card className="rounded-[var(--radius)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('selectScenario')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectScenario(s.id)}
                      className={cn(
                        'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      )}
                    >
                      <div className={cn(
                        'p-3 rounded-full',
                        s.id === 'learning' && 'bg-blue-100 text-blue-600',
                        s.id === 'work' && 'bg-green-100 text-green-600',
                        s.id === 'life' && 'bg-pink-100 text-pink-600'
                      )}>
                        {s.icon}
                      </div>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 问题输入 */}
          {step === 'input' && (
            <Card className="rounded-[var(--radius)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{SCENARIOS.find(s => s.id === scenario)?.label}</Badge>
                  <CardTitle className="text-lg">{t('inputQuestion')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptInput
                  value={originalQuestion}
                  onChange={setOriginalQuestion}
                  placeholder={t('questionPlaceholder')}
                  maxLength={500}
                  rows={3}
                  showCount
                />

                {/* 快捷示例 */}
                {scenario && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('examples')}</p>
                    <div className="flex flex-wrap gap-2">
                      {SCENARIOS.find(s => s.id === scenario)?.examples.map((example) => (
                        <button
                          key={example}
                          onClick={() => setOriginalQuestion(example)}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <LegoButton
                    onClick={handleStartTraining}
                    disabled={!originalQuestion.trim() || isLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <SparkleIcon className="mr-2 h-4 w-4" />
                    )}
                    {t('startTraining')}
                  </LegoButton>
                  <Button
                    variant="outline"
                    onClick={handleSkipGuidance}
                    disabled={!originalQuestion.trim() || isLoading}
                  >
                    {t('skipGuidance')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 对话引导 */}
          {step === 'dialogue' && (
            <Card className="rounded-[var(--radius)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {dialogue.length}/{estimatedRounds} {t('rounds')}
                    </Badge>
                    <CardTitle className="text-lg">{t('dialogueTitle')}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    {t('cancel')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 对话历史 */}
                <div className="space-y-3">
                  {dialogue.filter(d => d.answer).map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          AI
                        </div>
                        <div className="text-sm text-muted-foreground">{item.question}</div>
                      </div>
                      <div className="flex items-start gap-2 ml-8">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white">
                          你
                        </div>
                        <div className="text-sm">{item.answer}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 当前问题 */}
                {currentQuestion && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <SparkleIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{currentQuestion}</p>
                        {currentOptions && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {currentOptions.map((option) => (
                              <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                disabled={isLoading}
                                className="text-sm px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                        {currentOptions === undefined && (
                          <PromptInput
                            value={dialogue[dialogue.length - 1]?.answer || ''}
                            onChange={(val) => {
                              const newDialogue = [...dialogue];
                              newDialogue[newDialogue.length - 1].answer = val;
                              setDialogue(newDialogue);
                            }}
                            placeholder={t('answerPlaceholder')}
                            maxLength={200}
                            rows={2}
                            submitOnCtrlEnter
                            onSubmit={() => {
                              const answer = dialogue[dialogue.length - 1]?.answer;
                              if (answer?.trim()) {
                                handleAnswer(answer.trim());
                              }
                            }}
                            className="mt-3"
                          />
                        )}
                        {isLoading && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Spinner className="h-4 w-4" />
                            {t('thinking')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 结果展示 */}
          {step === 'result' && (
            <div className="space-y-6">
              {/* 对比卡片 */}
              <Card className="rounded-[var(--radius)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SparkleIcon className="h-5 w-5 text-green-500" />
                    {t('resultTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 原始问题 */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('originalQuestion')}</p>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm">{originalQuestion}</p>
                    </div>
                  </div>

                  {/* 优化后的问题 */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('optimizedQuestion')}</p>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{optimizedQuestion}</p>
                        <CopyButton value={optimizedQuestion} />
                      </div>
                    </div>
                  </div>

                  {/* 解释 */}
                  {explanation && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        💡 {explanation}
                      </p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-2">
                    <LegoButton onClick={handleCompare} disabled={isLoading} className="flex-1">
                      {isLoading ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        <ArrowRightIcon className="mr-2 h-4 w-4" />
                      )}
                      {t('compareEffect')}
                    </LegoButton>
                    <Button variant="outline" onClick={handleReset}>
                      <ArrowsClockwiseIcon className="mr-2 h-4 w-4" />
                      {t('tryAgain')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 效果对比 */}
              {showComparison && (
                <Card className="rounded-[var(--radius)] border-green-500/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                      <SparkleIcon className="h-5 w-5" />
                      {t('comparisonTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* 原始问题回答 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{t('originalResult')}</Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">
                            {originalAnswer || t('noAnswer')}
                          </p>
                        </div>
                      </div>

                      {/* 优化后问题回答 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">{t('optimizedResult')}</Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {optimizedAnswer || t('noAnswer')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      {t('ahaMoment')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
