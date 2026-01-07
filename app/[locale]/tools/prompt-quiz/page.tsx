'use client';

/**
 * 提问挑战游戏页面
 * 用户编写 Prompt，AI 执行后与正确答案对齐
 */

import * as React from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/prompt-input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  UserIcon,
  FilmReelIcon,
  BriefcaseIcon,
  BugIcon,
  MapPinIcon,
  ClockIcon,
  TrophyIcon,
  GameControllerIcon,
  SparkleIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';

// 主题类型
type Topic = 'person' | 'movie' | 'occupation' | 'animal' | 'city' | 'history' | 'sports' | 'anime' | 'tech';
type GameState = 'topic' | 'playing' | 'generating';

// 主题配置
const TOPICS: Array<{
  id: Topic;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { id: 'person', label: '猜人物', icon: <UserIcon className="h-6 w-6" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' },
  { id: 'movie', label: '猜电影', icon: <FilmReelIcon className="h-6 w-6" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' },
  { id: 'occupation', label: '猜职业', icon: <BriefcaseIcon className="h-6 w-6" />, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
  { id: 'animal', label: '猜动物', icon: <BugIcon className="h-6 w-6" />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
  { id: 'city', label: '猜城市', icon: <MapPinIcon className="h-6 w-6" />, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
  { id: 'history', label: '猜历史', icon: <ClockIcon className="h-6 w-6" />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
  { id: 'sports', label: '猜体育', icon: <TrophyIcon className="h-6 w-6" />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' },
  { id: 'anime', label: '猜动漫', icon: <SparkleIcon className="h-6 w-6" />, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400' },
  { id: 'tech', label: '猜科技', icon: <GameControllerIcon className="h-6 w-6" />, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400' },
];

export default function PromptQuizPage() {
  const t = useTranslations('PromptQuiz');

  // 游戏状态
  const [gameState, setGameState] = useState<GameState>('topic');
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [alignment, setAlignment] = useState<{
    score: number;
    matchedPoints: string[];
    unmatchedPoints: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // 开始新游戏
  const handleStartGame = async (topic: Topic) => {
    setIsLoading(true);
    setCurrentTopic(topic);
    setUserPrompt('');
    setAiOutput('');
    setAlignment(null);
    setAttempts(0);

    try {
      const response = await fetch('/api/tools/prompt-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', topic }),
      });

      if (!response.ok) throw new Error('Failed to start game');

      const data = await response.json();
      setCorrectAnswer(data.answer);
      setKeyPoints(data.keyPoints || []);
      setGameState('playing');
    } catch (error) {
      console.error('[PromptQuiz] Start game error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 执行 Prompt
  const handleGenerate = async () => {
    if (!userPrompt.trim() || !currentTopic) return;

    setIsLoading(true);
    setGameState('generating');

    try {
      const response = await fetch('/api/tools/prompt-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: currentTopic,
          userPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setAiOutput(data.aiOutput);
      setAlignment(data.alignment);
      setAttempts(prev => prev + 1);
      setGameState('playing');
    } catch (error) {
      console.error('[PromptQuiz] Generate error:', error);
      setGameState('playing');
    } finally {
      setIsLoading(false);
    }
  };

  // 重新开始
  const handleRestart = () => {
    setGameState('topic');
    setCurrentTopic(null);
    setCorrectAnswer('');
    setKeyPoints([]);
    setUserPrompt('');
    setAiOutput('');
    setAlignment(null);
    setAttempts(0);
  };

  // 换一题
  const handleNext = () => {
    if (currentTopic) {
      handleStartGame(currentTopic);
    }
  };

  // 获取当前主题配置
  const currentTopicConfig = TOPICS.find(t => t.id === currentTopic);

  // 对齐度颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：主题选择或状态 */}
        <div className="lg:col-span-1 space-y-6">
          {gameState === 'topic' ? (
            <Card className="rounded-[var(--radius)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GameControllerIcon className="h-5 w-5 text-primary" />
                  {t('selectTopic')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {TOPICS.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleStartGame(topic.id)}
                      disabled={isLoading}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        'flex flex-col items-center gap-2 text-center',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <div className={cn('p-2 rounded-full', topic.color)}>
                        {topic.icon}
                      </div>
                      <span className="text-sm font-medium">{topic.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="pt-6">
                {/* 当前主题 */}
                <div className="flex items-center gap-3 mb-4">
                  {currentTopicConfig && (
                    <div className={cn('p-2 rounded-full', currentTopicConfig.color)}>
                      {currentTopicConfig.icon}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t('currentTopic')}</p>
                    <p className="font-medium">{currentTopicConfig?.label}</p>
                  </div>
                </div>

                {/* 正确答案 */}
                <div className="p-4 bg-primary/10 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('correctAnswer')}</p>
                  <p className="text-xl font-bold text-primary">{correctAnswer}</p>
                </div>

                {/* 尝试次数 */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
                  <span className="text-sm">{t('attempts')}</span>
                  <Badge variant="secondary">{attempts} {t('times')}</Badge>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-2">
                  <Button onClick={handleNext} variant="outline" className="w-full">
                    <ArrowsClockwiseIcon className="h-4 w-4 mr-2" />
                    {t('nextQuestion')}
                  </Button>
                  <Button onClick={handleRestart} variant="ghost" className="w-full">
                    {t('changeTopic')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 游戏说明 */}
          <Card className="rounded-[var(--radius)] bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <h4 className="font-medium">{t('howToPlay')}</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t('rule1')}</li>
                  <li>{t('rule2')}</li>
                  <li>{t('rule3')}</li>
                  <li>{t('rule4')}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：主区域 */}
        <div className="lg:col-span-2">
          {gameState === 'topic' && (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <GameControllerIcon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('welcomeTitle')}</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    {t('welcomeDesc')}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <SparkleIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{t('feature1')}</p>
                      <p className="text-xs text-muted-foreground">{t('feature1Desc')}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <CheckCircleIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{t('feature2')}</p>
                      <p className="text-xs text-muted-foreground">{t('feature2Desc')}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <TrophyIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{t('feature3')}</p>
                      <p className="text-xs text-muted-foreground">{t('feature3Desc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {gameState === 'playing' && (
            <>
              {/* Prompt 输入 */}
              <Card className="rounded-[var(--radius)] mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-muted-foreground">📝</span>
                    {t('yourPrompt')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <PromptInput
                      value={userPrompt}
                      onChange={(value) => setUserPrompt(value)}
                      placeholder={t('promptPlaceholder')}
                      disabled={isLoading}
                      rows={3}
                      showCount={false}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerate}
                        disabled={!userPrompt.trim() || isLoading}
                        className="flex-1"
                      >
                        {isLoading ? t('generating') : t('generate')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI 输出结果 */}
              {aiOutput && (
                <Card className="rounded-[var(--radius)] mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-muted-foreground">🤖</span>
                      {t('aiOutput')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                      {aiOutput}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 对齐结果 */}
              {alignment && (
                <Card className="rounded-[var(--radius)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-muted-foreground">📊</span>
                      {t('alignmentResult')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 对齐度分数 */}
                    <div className="flex items-center justify-center mb-6">
                      <div className={cn('text-6xl font-bold', getScoreColor(alignment.score))}>
                        {alignment.score}%
                      </div>
                    </div>

                    {/* 关键信息对比 */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* 命中 */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4" />
                          {t('matchedPoints')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {alignment.matchedPoints.length > 0 ? (
                            alignment.matchedPoints.map((point, i) => (
                              <Badge key={i} variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400">
                                {point}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">{t('noMatchedPoints')}</p>
                          )}
                        </div>
                      </div>

                      {/* 未命中 */}
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                          <XCircleIcon className="h-4 w-4" />
                          {t('unmatchedPoints')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {alignment.unmatchedPoints.length > 0 ? (
                            alignment.unmatchedPoints.map((point, i) => (
                              <Badge key={i} variant="outline" className="border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                                {point}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-green-600 dark:text-green-400">{t('allPointsMatched')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 继续优化提示 */}
                    {alignment.score < 100 && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 {t('optimizationTip')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* 生成中状态 */}
          {gameState === 'generating' && (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative h-12 w-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-muted animate-spin">
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('generatingTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('generatingDesc')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
