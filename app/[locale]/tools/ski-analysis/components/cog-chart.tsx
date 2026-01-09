'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CenterOfGravityDataPoint {
  timestamp: number;
  value: number;
}

interface KeyframeMarker {
  timestamp: number;
  category: 'embarrassing' | 'awesome' | 'technique';
  caption: string;
}

interface CenterOfGravityChartProps {
  data: CenterOfGravityDataPoint[];
  keyframes?: KeyframeMarker[];
  stats?: {
    avgHeight: number;
    minHeight: number;
    maxHeight: number;
  };
  roastLevel?: 'mild' | 'medium' | 'spicy';
}

interface ChartDataPoint {
  time: number;
  height: number;
  formattedTime: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'embarrassing':
      return '#ef4444'; // red
    case 'awesome':
      return '#22c55e'; // green
    case 'technique':
      return '#3b82f6'; // blue
    default:
      return '#6b7280'; // gray
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg">
      <p className="font-medium">{data.formattedTime}</p>
      <p className="text-blue-600 font-semibold">
        重心高度: {(data.height * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export function CenterOfGravityChart({
  data,
  keyframes = [],
  stats,
  roastLevel = 'medium',
}: CenterOfGravityChartProps) {
  const chartData = useMemo((): ChartDataPoint[] => {
    return data.map((d) => ({
      time: d.timestamp,
      height: d.value,
      formattedTime: formatTime(d.timestamp),
    }));
  }, [data]);

  const formattedStats = useMemo(() => {
    if (!stats) return null;
    return {
      avg: stats.avgHeight * 100,
      min: stats.minHeight * 100,
      max: stats.maxHeight * 100,
    };
  }, [stats]);

  const keyframeDataPoints = useMemo(() => {
    return keyframes.map((kf) => {
      const dataPoint = chartData.find(
        (d) => Math.abs(d.time - kf.timestamp) < 0.5
      );
      return {
        ...kf,
        height: dataPoint?.height ?? 0.5,
      };
    });
  }, [keyframes, chartData]);

  if (data.length === 0) {
    return (
      <Card className="rounded-[var(--radius)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            重心变化曲线
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            暂无姿态数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[var(--radius)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            重心变化曲线
          </div>
          {keyframes.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {keyframes.length} 个精彩瞬间
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 统计摘要 */}
        {formattedStats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">平均重心</p>
              <p className="text-lg font-bold">{formattedStats.avg.toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <p className="text-xs text-muted-foreground">最低重心</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formattedStats.min.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">重心波动</p>
              <p className="text-lg font-bold">
                {(formattedStats.max - formattedStats.min).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* 图表 */}
        <div className="h-[250px] w-full" style={{ minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={250}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cogGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => formatTime(value)}
                label={{
                  value: '时间',
                  position: 'bottom',
                  offset: 0,
                }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 'dataMax + 0.05']}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                label={{
                  value: '重心高度',
                  angle: -90,
                  position: 'insideLeft',
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="height"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#cogGradient)"
              />

              {/* 关键帧标记 */}
              {keyframeDataPoints.map((kf, i) => (
                <ReferenceDot
                  key={i}
                  x={kf.timestamp}
                  y={kf.height}
                  r={6}
                  fill={getCategoryColor(kf.category)}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}

              {/* 平均值参考线 */}
              {formattedStats && (
                <ReferenceLine
                  y={formattedStats.avg / 100}
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  label={{
                    value: '平均',
                    position: 'right',
                    fill: '#64748b',
                    fontSize: 12,
                  }}
                />
              )}

              {/* 最低重心参考线 */}
              {formattedStats && (
                <ReferenceLine
                  y={formattedStats.min / 100}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  label={{
                    value: '最低',
                    position: 'right',
                    fill: '#3b82f6',
                    fontSize: 12,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 关键帧图例 */}
        {keyframes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground mr-2">标记:</span>
            {keyframes.map((kf, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCategoryColor(kf.category) }}
                />
                <span>
                  {kf.category === 'embarrassing'
                    ? '狼狈'
                    : kf.category === 'awesome'
                    ? '帅气'
                    : '技术'}
                </span>
                <span className="text-muted-foreground ml-1">
                  {formatTime(kf.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
