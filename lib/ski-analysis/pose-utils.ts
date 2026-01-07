/**
 * Pose Data Utilities
 *
 * Converts MediaPipe pose analysis data to human-readable text
 * for LLM consumption.
 */

import type { PoseAnalysisResult, FrameMetrics } from './types';

// Threshold constants
const COG_THRESHOLDS = { low: 0.15, high: 0.35 } as const;
const TILT_THRESHOLDS = { severe: 30, moderate: 20, mild: 10, slight: 5 } as const;
const KNEE_THRESHOLDS = { deep: 90, standard: 110, shallow: 130 } as const;
const ASYMMETRY_THRESHOLDS = { severe: 20, moderate: 10, mild: 5 } as const;

// Interpretation helpers using threshold ranges
function interpretInRange(value: number, thresholds: readonly number[], labels: string[]): string {
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) return labels[i];
  }
  return labels[labels.length - 1];
}

const interpretCogHeight = (h: number) =>
  interpretInRange(h, [COG_THRESHOLDS.low, COG_THRESHOLDS.high], [
    '很低（深蹲姿态）', '适中（标准低姿态）', '较高（站姿偏高，重心偏高）'
  ]);

const interpretTiltAngle = (angle: number) => {
  const absAngle = Math.abs(angle);
  if (absAngle < TILT_THRESHOLDS.slight) return `接近中立位（${absAngle.toFixed(1)}°）`;
  return interpretInRange(absAngle,
    [TILT_THRESHOLDS.mild, TILT_THRESHOLDS.moderate, TILT_THRESHOLDS.severe],
    [`轻微倾斜 ${absAngle.toFixed(1)}°`, `适度倾斜 ${absAngle.toFixed(1)}°`,
     `明显倾斜 ${absAngle.toFixed(1)}°（内倾充足）`, `过度倾斜 ${absAngle.toFixed(1)}°`]
  );
};

const interpretKneeFlexion = (deg: number) =>
  interpretInRange(deg, [KNEE_THRESHOLDS.deep, KNEE_THRESHOLDS.standard, KNEE_THRESHOLDS.shallow], [
    '折叠很深（低姿态转弯）', '折叠适中（标准转弯姿态）', '折叠较浅（站姿转弯）', '接近伸直（立刃不足）'
  ]);

const interpretAsymmetry = (diff: number) =>
  interpretInRange(diff, [ASYMMETRY_THRESHOLDS.mild, ASYMMETRY_THRESHOLDS.moderate, ASYMMETRY_THRESHOLDS.severe], [
    '左右轻微差异', '左右略有差异，需注意', '⚠️ 左右差异过大，需要平衡训练', '左右对称良好'
  ]);

function formatFrame(frame: FrameMetrics): string {
  const { timestamp, metrics } = frame;
  const asymmetry = Math.abs(metrics.leftKneeFlexion - metrics.rightKneeFlexion);

  return [
    `第 ${timestamp.toFixed(1)} 秒：`,
    `  - 重心高度: ${(metrics.centerOfGravityHeight * 100).toFixed(1)}%帧高（${interpretCogHeight(metrics.centerOfGravityHeight)}）`,
    `  - 身体倾斜: ${interpretTiltAngle(metrics.bodyTiltAngle)}`,
    `  - 膝盖状态: ${interpretKneeFlexion(metrics.leftKneeFlexion)} / ${interpretKneeFlexion(metrics.rightKneeFlexion)}`,
    `  - 左膝: ${metrics.leftKneeFlexion.toFixed(0)}°, 右膝: ${metrics.rightKneeFlexion.toFixed(0)}°（${interpretAsymmetry(asymmetry)}）`
  ].join('\n');
}

export function formatPoseDataForLLM(result: PoseAnalysisResult): string {
  const maxFrames = 20;
  const { summary } = result;

  const lines = [
    '=== 姿态分析数据 (POSE DATA) ===\n',
    ...result.frames.slice(0, maxFrames).map(formatFrame),
    result.frames.length > maxFrames ? `\n... 共分析 ${result.frames.length} 帧，此处显示前 ${maxFrames} 帧` : '',
    '\n=== 统计摘要 ===',
    `  有效分析帧数: ${summary.framesAnalyzed}`,
    `  平均重心高度: ${(summary.avgCenterOfGravityHeight * 100).toFixed(1)}%帧高`,
    `  最低重心高度: ${(summary.minCenterOfGravityHeight * 100).toFixed(1)}%帧高（最低姿态）`,
    `  最大身体倾斜: ${summary.maxBodyTilt.toFixed(1)}°`,
    `  平均膝盖折叠: ${summary.avgKneeFlexion.toFixed(1)}°`,
    `  左右不对称度: ${summary.leftRightAsymmetry.toFixed(1)}°`,
    '\n=== 关键观察点 ===',
    summary.minCenterOfGravityHeight > 0.35 ? '  ⚠️ 整体重心偏高，建议加强低姿态训练' : '',
    summary.maxBodyTilt > 25 ? '  ⚠️ 存在过度倾斜，需要改善平衡' : '',
    summary.leftRightAsymmetry > 15 ? '  ⚠️ 左右动作不对称，需要针对性平衡训练' : '',
    summary.avgKneeFlexion > 130 ? '  ⚠️ 膝盖折叠不足，立刃可能不够深' : '',
    summary.avgKneeFlexion < 100 && summary.avgCenterOfGravityHeight < 0.3 ? '  ✓ 低姿态保持良好，重心控制稳定' : '',
  ].filter(Boolean);

  return lines.join('\n');
}

export function getPoseDataPromptSection(poseDataText: string): string {
  return `
=== 姿态分析数据 (POSE DATA) ===
${poseDataText}

=== 分析要求 ===
基于上述结构化姿态数据，结合视频画面，给出专业滑雪教练级分析。
重点关注：
1. 重心高度变化趋势（过低/过高/不稳定）
2. 身体倾斜角与转弯方向的匹配度
3. 膝盖折叠度与转弯阶段的关系
4. 左右两侧的对称性
5. 给出具体时间戳和量化改进建议

请使用以下格式输出：
- 总体评估（1-2句话）
- 技术评分（stance, turns, edgeControl, pressureManagement, polePlant）
- 优势点
- 待改进点
- 优先级改进建议（含具体练习方法）
`;
}

export function isValidPoseData(result: PoseAnalysisResult): boolean {
  return result.frames.length > 0 && result.summary.framesAnalyzed > 0 && result.summary.avgCenterOfGravityHeight > 0;
}

export function getPoseQualityMetrics(result: PoseAnalysisResult): {
  frameCount: number;
  coverage: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const frameCount = result.summary.framesAnalyzed;
  const duration = result.summary.videoDuration;
  const coverage = duration > 0 ? frameCount / duration : 0;

  const confidence = frameCount >= 10 && coverage >= 0.5 ? 'high'
    : frameCount >= 5 && coverage >= 0.2 ? 'medium' : 'low';

  return { frameCount, coverage, confidence };
}
