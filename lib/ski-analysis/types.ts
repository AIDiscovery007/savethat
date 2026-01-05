/**
 * Type definitions for Ski Analysis Pose Detection
 */

/**
 * A single pose landmark from MediaPipe
 */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

/**
 * Key landmarks used for ski analysis
 */
export interface SkiKeyLandmarks {
  leftShoulder: PoseLandmark;
  rightShoulder: PoseLandmark;
  leftHip: PoseLandmark;
  rightHip: PoseLandmark;
  leftKnee: PoseLandmark;
  rightKnee: PoseLandmark;
  leftAnkle: PoseLandmark;
  rightAnkle: PoseLandmark;
}

/**
 * Computed biomechanical metrics for a single frame
 */
export interface FrameMetrics {
  /** Timestamp in seconds */
  timestamp: number;

  /** Key landmarks for this frame */
  landmarks: SkiKeyLandmarks;

  /** Computed metrics */
  metrics: {
    /** Center of gravity height as proportion of frame height (0-1) */
    centerOfGravityHeight: number;

    /** Body tilt angle in degrees from vertical (0-90) */
    bodyTiltAngle: number;

    /** Left knee flexion angle in degrees */
    leftKneeFlexion: number;

    /** Right knee flexion angle in degrees */
    rightKneeFlexion: number;
  };
}

/**
 * Summary statistics for the entire video analysis
 */
export interface PoseAnalysisSummary {
  /** Average center of gravity height as proportion (0-1) */
  avgCenterOfGravityHeight: number;

  /** Minimum center of gravity height (lowest stance) as proportion (0-1) */
  minCenterOfGravityHeight: number;

  /** Maximum body tilt angle in degrees */
  maxBodyTilt: number;

  /** Average knee flexion angle */
  avgKneeFlexion: number;

  /** Left/right asymmetry score (0-180 degrees difference) */
  leftRightAsymmetry: number;

  /** Number of frames successfully analyzed */
  framesAnalyzed: number;

  /** Video duration in seconds */
  videoDuration: number;
}

/**
 * Complete pose analysis result
 */
export interface PoseAnalysisResult {
  /** Individual frame data */
  frames: FrameMetrics[];

  /** Summary statistics */
  summary: PoseAnalysisSummary;

  /** Metadata */
  metadata: {
    /** Source video filename */
    videoFileName: string;

    /** Frame sampling interval in seconds */
    samplingInterval: number;

    /** Model used for pose detection */
    modelType: string;

    /** Processing timestamp */
    processedAt: string;
  };
}

/**
 * Text format of pose data for LLM consumption
 */
export interface PoseDataText {
  /** Formatted frame data */
  frames: string;

  /** Formatted summary */
  summary: string;
}

/**
 * Raw MediaPipe detection result
 */
export interface MediaPipeDetectionResult {
  poseLandmarks: PoseLandmark[];
  poseWorldLandmarks: PoseLandmark[];
}
