/**
 * Pose Data Utilities
 *
 * Converts MediaPipe pose analysis data to human-readable text
 * for LLM consumption.
 */

import type { PoseAnalysisResult, FrameMetrics } from './types';

/**
 * 重心高度阈值
 */
const COG_THRESHOLDS = { low: 0.15, high: 0.35 } as const;

/**
 * 身体倾斜角度阈值（度）
 */
const TILT_THRESHOLDS = { severe: 30, moderate: 20, mild: 10, slight: 5 } as const;

/**
 * 膝盖折叠角度阈值（度）
 */
const KNEE_THRESHOLDS = { deep: 90, standard: 110, shallow: 130 } as const;

/**
 * 左右不对称度阈值（度）
 */
const ASYMMETRY_THRESHOLDS = { severe: 20, moderate: 10, mild: 5 } as const;

/**
 * Interpret center of gravity height description
 * Height is now a proportion (0-1) of frame height
 */
function interpretCogHeight(height: number): string {
  // For ski posture, typical values:
  // Very low crouch: < 0.15 (about 15% of frame height)
  // Good athletic stance: 0.15-0.35
  // Standing too tall: > 0.35
  if (height < COG_THRESHOLDS.low) return '很低（深蹲姿态）';
  if (height < COG_THRESHOLDS.high) return '适中（标准低姿态）';
  return '较高（站姿偏高，重心偏高）';
}

/**
 * Interpret body tilt angle description
 * Angle is now absolute value from vertical (0-90 degrees)
 */
function interpretTiltAngle(angle: number): string {
  const absAngle = Math.abs(angle);
  if (absAngle > TILT_THRESHOLDS.severe) return `过度倾斜 ${absAngle.toFixed(1)}°`;
  if (absAngle > TILT_THRESHOLDS.moderate) return `明显倾斜 ${absAngle.toFixed(1)}°（内倾充足）`;
  if (absAngle > TILT_THRESHOLDS.mild) return `适度倾斜 ${absAngle.toFixed(1)}°`;
  if (absAngle > TILT_THRESHOLDS.slight) return `轻微倾斜 ${absAngle.toFixed(1)}°`;
  return `接近中立位（${absAngle.toFixed(1)}°）`;
}

/**
 * Interpret knee flexion description
 */
function interpretKneeFlexion(degrees: number): string {
  if (degrees < KNEE_THRESHOLDS.deep) return '折叠很深（低姿态转弯）';
  if (degrees < KNEE_THRESHOLDS.standard) return '折叠适中（标准转弯姿态）';
  if (degrees < KNEE_THRESHOLDS.shallow) return '折叠较浅（站姿转弯）';
  return '接近伸直（立刃不足）';
}

/**
 * Interpret left/right asymmetry description
 */
function interpretAsymmetry(diff: number): string {
  if (diff > ASYMMETRY_THRESHOLDS.severe) return '⚠️ 左右差异过大，需要平衡训练';
  if (diff > ASYMMETRY_THRESHOLDS.moderate) return '左右略有差异，需注意';
  if (diff > ASYMMETRY_THRESHOLDS.mild) return '左右轻微差异';
  return '左右对称良好';
}

/**
 * Format a single frame for LLM
 */
function formatFrame(frame: FrameMetrics): string {
  const { timestamp, metrics } = frame;
  const asymmetry = Math.abs(metrics.leftKneeFlexion - metrics.rightKneeFlexion);

  const lines: string[] = [];

  lines.push(`第 ${timestamp.toFixed(1)} 秒：`);

  lines.push(
    `  - 重心高度: ${(metrics.centerOfGravityHeight * 100).toFixed(1)}%帧高（${interpretCogHeight(metrics.centerOfGravityHeight)}）`
  );
  lines.push(`  - 身体倾斜: ${interpretTiltAngle(metrics.bodyTiltAngle)}`);
  lines.push(`  - 膝盖状态: ${interpretKneeFlexion(metrics.leftKneeFlexion)} / ${interpretKneeFlexion(metrics.rightKneeFlexion)}`);
  lines.push(
    `  - 左膝: ${metrics.leftKneeFlexion.toFixed(0)}°, 右膝: ${metrics.rightKneeFlexion.toFixed(0)}°（${interpretAsymmetry(asymmetry)}）`
  );

  return lines.join('\n');
}

/**
 * Format pose analysis result as readable text for LLM
 */
export function formatPoseDataForLLM(result: PoseAnalysisResult): string {
  const lines: string[] = [];

  lines.push('=== 姿态分析数据 (POSE DATA) ===\n');

  // Frame data (limit to first 20 frames to avoid token overflow)
  const maxFrames = 20;
  const framesToShow = result.frames.slice(0, maxFrames);

  for (const frame of framesToShow) {
    lines.push(formatFrame(frame));
  }

  if (result.frames.length > maxFrames) {
    lines.push(`\n... 共分析 ${result.frames.length} 帧，此处显示前 ${maxFrames} 帧`);
  }

  // Summary
  const { summary } = result;
  lines.push('\n=== 统计摘要 ===');
  lines.push(`  有效分析帧数: ${summary.framesAnalyzed}`);
  lines.push(`  平均重心高度: ${(summary.avgCenterOfGravityHeight * 100).toFixed(1)}%帧高`);
  lines.push(`  最低重心高度: ${(summary.minCenterOfGravityHeight * 100).toFixed(1)}%帧高（最低姿态）`);
  lines.push(`  最大身体倾斜: ${summary.maxBodyTilt.toFixed(1)}°`);
  lines.push(`  平均膝盖折叠: ${summary.avgKneeFlexion.toFixed(1)}°`);
  lines.push(`  左右不对称度: ${summary.leftRightAsymmetry.toFixed(1)}°`);

  // Key observations for the LLM
  lines.push('\n=== 关键观察点 ===');
  if (summary.minCenterOfGravityHeight > 0.35) {
    lines.push('  ⚠️ 整体重心偏高，建议加强低姿态训练');
  }
  if (summary.maxBodyTilt > 25) {
    lines.push('  ⚠️ 存在过度倾斜，需要改善平衡');
  }
  if (summary.leftRightAsymmetry > 15) {
    lines.push('  ⚠️ 左右动作不对称，需要针对性平衡训练');
  }
  if (summary.avgKneeFlexion > 130) {
    lines.push('  ⚠️ 膝盖折叠不足，立刃可能不够深');
  }
  if (summary.avgKneeFlexion < 100 && summary.avgCenterOfGravityHeight < 0.3) {
    lines.push('  ✓ 低姿态保持良好，重心控制稳定');
  }

  return lines.join('\n');
}

/**
 * Get structured prompt addition for pose data
 */
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

/**
 * Check if pose data is valid for analysis
 */
export function isValidPoseData(result: PoseAnalysisResult): boolean {
  return (
    result.frames.length > 0 &&
    result.summary.framesAnalyzed > 0 &&
    result.summary.avgCenterOfGravityHeight > 0
  );
}

/**
 * Get pose analysis quality metrics
 */
export function getPoseQualityMetrics(result: PoseAnalysisResult): {
  frameCount: number;
  coverage: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const frameCount = result.summary.framesAnalyzed;
  const duration = result.summary.videoDuration;
  const coverage = duration > 0 ? frameCount / duration : 0;

  let confidence: 'high' | 'medium' | 'low';
  if (frameCount >= 10 && coverage >= 0.5) {
    confidence = 'high';
  } else if (frameCount >= 5 && coverage >= 0.2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { frameCount, coverage, confidence };
}
