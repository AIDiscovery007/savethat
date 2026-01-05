'use client';

/**
 * 滑雪动作分析工具主页面
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoUploader } from './components/video-uploader';
import { SkillSelector } from './components/skill-selector';
import { ColorSelector } from './components/color-selector';
import { SkiAnalysisResult } from './components/analysis-result';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ActivityIcon,
  InfoIcon,
  SparkleIcon,
  Spinner,
} from '@phosphor-icons/react';

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';

interface AnalysisResult {
  overallAssessment?: {
    level?: string;
    style?: string;
    score?: number;
    summary?: string;
  };
  technicalScores?: {
    stance?: number;
    turns?: number;
    edgeControl?: number;
    pressureManagement?: number;
    polePlant?: number;
  };
  strengths?: string[];
  areasForImprovement?: string[];
  timestampedIssues?: Array<{
    time: string;
    category?: string;
    issue: string;
    severity?: string;
  }>;
  priorityImprovements?: Array<{
    priority: string;
    focus: string;
    exercises?: string[];
    drills?: string[];
  }>;
  drillRecommendations?: Array<{
    name: string;
    description: string;
    target?: string;
  }>;
  safetyNotes?: string[];
  rawAnalysis?: string;
}

export default function SkiAnalysisPage() {
  const t = useTranslations('SkiAnalysis');

  // 状态
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [skillLevel, setSkillLevel] = React.useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [jacketColor, setJacketColor] = React.useState<string>('');
  const [pantsColor, setPantsColor] = React.useState<string>('');
  const [helmetColor, setHelmetColor] = React.useState<string>('');
  const [state, setState] = React.useState<AnalysisState>('idle');
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<number>(0);

  // 处理视频选择
  const handleVideoSelect = async (file: File, url: string) => {
    setVideoFile(file);
    setPreviewUrl(url);
    setState('uploading');
    setError(null);

    // 自动开始分析
    await analyzeVideo(file, url);
  };

  // 处理视频移除
  const handleVideoRemove = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setState('idle');
  };

  // 分析视频
  const analyzeVideo = async (file: File, url: string) => {
    setState('analyzing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('level', skillLevel);
      if (jacketColor) formData.append('jacketColor', jacketColor);
      if (pantsColor) formData.append('pantsColor', pantsColor);
      if (helmetColor) formData.append('helmetColor', helmetColor);

      // 5分钟超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const response = await fetch('/api/ski-analysis', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data.result);
      setDuration(data.duration);
      setState('completed');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
      setState('error');
    }
  };

  // 重新分析
  const handleReset = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setState('idle');
    // 可选：重置颜色（如果需要的话，可以取消注释）
    // setJacketColor('');
    // setPantsColor('');
    // setHelmetColor('');
  };

  // 格式化耗时
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：设置和上传 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 技能水平选择 */}
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-primary" />
                {t('settings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SkillSelector
                value={skillLevel}
                onChange={setSkillLevel}
                disabled={state === 'analyzing'}
              />
            </CardContent>
          </Card>

          {/* 颜色选择器 */}
          <ColorSelector
            jacketColor={jacketColor}
            pantsColor={pantsColor}
            helmetColor={helmetColor}
            onJacketColorChange={setJacketColor}
            onPantsColorChange={setPantsColor}
            onHelmetColorChange={setHelmetColor}
            disabled={state === 'analyzing'}
          />

          {/* 视频上传 */}
          <VideoUploader
            onVideoSelect={handleVideoSelect}
            onVideoRemove={handleVideoRemove}
            selectedVideo={videoFile}
            previewUrl={previewUrl}
            isAnalyzing={state === 'analyzing'}
          />

          {/* 提示信息 */}
          <Card className="rounded-[var(--radius)] bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <InfoIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>{t('tips1')}</p>
                  <p>{t('tips2')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：结果展示 */}
        <div className="lg:col-span-2">
          {/* 空闲状态 */}
          {state === 'idle' && (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <SparkleIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('readyTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('readyDescription')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 上传中状态 */}
          {(state === 'uploading' || state === 'analyzing') && (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Spinner className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {state === 'uploading' ? t('uploading') : t('analyzing')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {state === 'uploading'
                    ? t('uploadingTip')
                    : t('analyzingTip')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 分析完成 */}
          {state === 'completed' && result && (
            <>
              {/* 分析完成提示 */}
              <Card className="rounded-[var(--radius)] mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <SparkleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{t('completed')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('completedTip', { duration: formatDuration(duration) })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 分析结果 */}
              <SkiAnalysisResult result={result} onReset={handleReset} />
            </>
          )}

          {/* 错误状态 */}
          {state === 'error' && (
            <Card className="rounded-[var(--radius)] border-destructive">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 bg-destructive/10 rounded-full mb-4">
                    <InfoIcon className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-destructive">
                    {t('error')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error}
                  </p>
                  <Button onClick={handleReset} variant="outline">
                    {t('tryAgain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
