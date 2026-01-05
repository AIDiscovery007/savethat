'use client';

/**
 * 滑雪分析结果展示组件
 */

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Activity,
  Camera,
} from 'lucide-react';
import { clsx } from 'clsx';
import { CenterOfGravityChart } from './cog-chart';

interface SkiAnalysisResultProps {
  result: SkiAnalysisData;
  poseData?: PoseData | null;
  onReset: () => void;
}

interface SkiAnalysisData {
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
  keyframes?: Keyframe[];
}

interface PoseData {
  frames: Array<{
    timestamp: number;
    metrics: {
      centerOfGravityHeight: number;
    };
  }>;
  summary: {
    avgCenterOfGravityHeight: number;
    minCenterOfGravityHeight: number;
  };
}

interface Keyframe {
  timestamp: number;
  timeFormatted: string;
  imageBase64: string;
  category: string;
  roastCaption: string;
  reason: string;
}

// 分数颜色
const getScoreColor = (score: number) => {
  if (score >= 7) return 'text-green-500';
  if (score >= 5) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 7) return 'bg-green-100 dark:bg-green-900';
  if (score >= 5) return 'bg-yellow-100 dark:bg-yellow-900';
  return 'bg-red-100 dark:bg-red-900';
};

const getSeverityBadge = (severity?: string) => {
  switch (severity) {
    case '高':
    case 'high':
      return <Badge variant="destructive">{severity}</Badge>;
    case '中':
    case 'medium':
      return <Badge variant="secondary">{severity}</Badge>;
    default:
      return <Badge variant="outline">{severity || '低'}</Badge>;
  }
};

export function SkiAnalysisResult({ result, poseData, onReset }: SkiAnalysisResultProps) {
  const t = useTranslations('SkiAnalysis');
  const [openSections, setOpenSections] = React.useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const { overallAssessment, technicalScores, strengths, areasForImprovement, timestampedIssues, priorityImprovements, drillRecommendations, safetyNotes, keyframes } = result;

  // 计算图表所需的数据
  const chartData = React.useMemo(() => {
    if (!poseData?.frames) return [];
    return poseData.frames.map(f => ({
      timestamp: f.timestamp,
      value: f.metrics.centerOfGravityHeight,
    }));
  }, [poseData]);

  const chartStats = React.useMemo(() => {
    if (!poseData?.summary) return undefined;
    return {
      avgHeight: poseData.summary.avgCenterOfGravityHeight,
      minHeight: poseData.summary.minCenterOfGravityHeight,
      maxHeight: 0.4, // 估算最大值
    };
  }, [poseData]);

  const keyframeMarkers = React.useMemo(() => {
    if (!keyframes) return [];
    return keyframes.map(kf => ({
      timestamp: kf.timestamp,
      category: kf.category as 'embarrassing' | 'awesome' | 'technique',
      caption: kf.roastCaption,
    }));
  }, [keyframes]);

  // 获取分类徽章样式
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'embarrassing':
        return <Badge variant="destructive">狼狈</Badge>;
      case 'awesome':
        return <Badge className="bg-green-500 hover:bg-green-600">帅气</Badge>;
      case 'technique':
        return <Badge variant="secondary">技术</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 总体评估 */}
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('overallAssessment')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overallAssessment && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overallAssessment.level && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">{t('level')}</p>
                  <p className="font-semibold">{overallAssessment.level}</p>
                </div>
              )}
              {overallAssessment.style && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">{t('style')}</p>
                  <p className="font-semibold">{overallAssessment.style}</p>
                </div>
              )}
              {overallAssessment.score !== undefined && (
                <div className={clsx('p-3 rounded-lg', getScoreBg(overallAssessment.score))}>
                  <p className="text-xs text-muted-foreground">{t('score')}</p>
                  <p className={clsx('font-semibold text-2xl', getScoreColor(overallAssessment.score))}>
                    {overallAssessment.score.toFixed(1)}
                  </p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">{t('summary')}</p>
                <p className="font-semibold text-sm">{overallAssessment?.summary || '-'}</p>
              </div>
            </div>
          )}

          {/* 技术评分 */}
          {technicalScores && Object.keys(technicalScores).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(technicalScores).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={clsx('text-2xl font-bold', getScoreColor(value || 0))}>
                    {value?.toFixed(1) || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 重心曲线图 */}
      {chartData.length > 0 && (
        <CenterOfGravityChart
          data={chartData}
          keyframes={keyframeMarkers}
          stats={chartStats}
        />
      )}

      {/* 关键帧画廊 */}
      {keyframes && keyframes.length > 0 && (
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              精彩瞬间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {keyframes.map((kf, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded-lg border"
                >
                  {/* 截图 */}
                  <img
                    src={kf.imageBase64}
                    alt={`Keyframe at ${kf.timeFormatted}`}
                    className="w-full h-48 object-cover"
                  />

                  {/* 悬浮遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm">
                        {kf.roastCaption}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {kf.reason}
                      </p>
                    </div>
                  </div>

                  {/* 时间标签 */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                      {kf.timeFormatted}
                    </Badge>
                  </div>

                  {/* 分类标签 */}
                  <div className="absolute top-2 right-2">
                    {getCategoryBadge(kf.category)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 优势与改进点 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 优势 */}
        {strengths && strengths.length > 0 && (
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {t('strengths')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 待改进 */}
        {areasForImprovement && areasForImprovement.length > 0 && (
          <Card className="rounded-[var(--radius)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                {t('areasForImprovement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {areasForImprovement.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 时间戳问题 */}
      {timestampedIssues && timestampedIssues.length > 0 && (
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('timestampedIssues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timestampedIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="font-mono">
                      {issue.time}
                    </Badge>
                    <div>
                      {issue.category && (
                        <p className="text-xs text-muted-foreground">{issue.category}</p>
                      )}
                      <p className="text-sm">{issue.issue}</p>
                    </div>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 优先级改进 */}
      {priorityImprovements && priorityImprovements.length > 0 && (
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t('priorityImprovements')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityImprovements.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={item.priority === '高' || item.priority === 'high' ? 'destructive' : 'secondary'}
                  >
                    {item.priority}
                  </Badge>
                  <p className="font-medium">{item.focus}</p>
                </div>
                {(item.exercises && item.exercises.length > 0) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">练习方法:</p>
                    <ul className="text-sm space-y-1">
                      {item.exercises.map((ex, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-primary">→</span>
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 专项训练建议 */}
      {drillRecommendations && drillRecommendations.length > 0 && (
        <Collapsible open={openSections.has('drills')} onOpenChange={() => toggleSection('drills')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              {t('drillRecommendations')}
              {openSections.has('drills') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2 rounded-[var(--radius)]">
              <CardContent className="pt-4 space-y-3">
                {drillRecommendations.map((drill, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-sm">{drill.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{drill.description}</p>
                    {drill.target && (
                      <p className="text-xs text-primary mt-1">针对: {drill.target}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 安全提示 */}
      {safetyNotes && safetyNotes.length > 0 && (
        <Card className="rounded-[var(--radius)] border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('safetyNotes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safetyNotes.map((note, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-destructive">
                  <span>!</span>
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 重新分析按钮 */}
      <Button variant="outline" onClick={onReset} className="w-full">
        {t('analyzeAgain')}
      </Button>
    </div>
  );
}
