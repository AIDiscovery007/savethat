"""
Ski Analysis Pose Analyzer

Uses MediaPipe Tasks API (0.10.x) to extract human pose landmarks from ski videos
and compute biomechanical metrics for AI analysis.
"""

import base64
import json
import math
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

import cv2
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision.core import image as mp_image


# MediaPipe landmark indices
class Landmarks:
    """MediaPipe Pose landmark indices."""
    NOSE = 0
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """
    Calculate the angle formed by three points a-b-c.

    Args:
        a: First point coordinates
        b: Middle point (vertex) coordinates
        c: Third point coordinates

    Returns:
        Angle in degrees
    """
    ba = a - b
    bc = c - b

    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # Clamp to avoid floating point errors
    cos_angle = max(-1.0, min(1.0, cos_angle))
    return math.degrees(math.acos(cos_angle))


def calculate_center_of_gravity_height(
    left_hip: np.ndarray,
    right_hip: np.ndarray,
    left_ankle: np.ndarray,
    right_ankle: np.ndarray
) -> float:
    """
    Calculate center of gravity height using hip and ankle positions.

    MediaPipe normalized coordinates: y-axis points DOWN (0 at top, 1 at bottom)
    World coordinates: y-axis points UP

    In normalized coords, hip is "above" ankle, so ankle y > hip y.
    Height = (ankle_y - hip_y) where height is the distance in vertical direction.

    Args:
        left_hip: Left hip normalized coordinates
        right_hip: Right hip normalized coordinates
        left_ankle: Left ankle normalized coordinates
        right_ankle: Right ankle normalized coordinates

    Returns:
        Height as proportion of frame height (0-1 range)
    """
    hip_center = (left_hip + right_hip) / 2
    ankle_center = (left_ankle + right_ankle) / 2

    # In normalized coordinates (y-down), ankle is "below" hip, so ankle[1] > hip[1]
    height = ankle_center[1] - hip_center[1]
    return max(0, height)  # Ensure non-negative


def calculate_body_tilt_angle(
    left_shoulder: np.ndarray,
    right_shoulder: np.ndarray,
    left_hip: np.ndarray,
    right_hip: np.ndarray
) -> float:
    """
    Calculate body tilt angle relative to vertical.

    MediaPipe normalized coordinates: x increases right, y increases down

    Args:
        left_shoulder: Left shoulder normalized coordinates
        right_shoulder: Right shoulder normalized coordinates
        left_hip: Left hip normalized coordinates
        right_hip: Right hip normalized coordinates

    Returns:
        Tilt angle in degrees from vertical (absolute value)
    """
    shoulder_center = (left_shoulder + right_shoulder) / 2
    hip_center = (left_hip + right_hip) / 2

    # Calculate the horizontal offset (x) and vertical distance (y)
    dx = shoulder_center[0] - hip_center[0]
    dy = shoulder_center[1] - hip_center[1]

    # Angle from vertical, take absolute value for simplicity
    angle = math.degrees(math.atan2(abs(dx), abs(dy)))
    return angle


def calculate_knee_flexion(
    hip: np.ndarray,
    knee: np.ndarray,
    ankle: np.ndarray
) -> float:
    """
    Calculate knee flexion angle.

    Args:
        hip: Hip world coordinates
        knee: Knee world coordinates
        ankle: Ankle world coordinates

    Returns:
        Knee flexion angle in degrees (180 = straight, smaller = more bent)
    """
    return calculate_angle(hip, knee, ankle)


def extract_key_landmarks(landmarks: list) -> dict:
    """
    Extract key landmarks for ski analysis from MediaPipe results.

    Args:
        landmarks: List of NormalizedLandmark objects

    Returns:
        Dictionary with key landmarks in world coordinates
    """
    def get(idx):
        lm = landmarks[idx]
        return np.array([lm.x, lm.y, lm.z])

    def get_visibility(idx):
        lm = landmarks[idx]
        return getattr(lm, 'visibility', getattr(lm, 'presence', 1.0))

    return {
        'leftShoulder': get(Landmarks.LEFT_SHOULDER),
        'rightShoulder': get(Landmarks.RIGHT_SHOULDER),
        'leftHip': get(Landmarks.LEFT_HIP),
        'rightHip': get(Landmarks.RIGHT_HIP),
        'leftKnee': get(Landmarks.LEFT_KNEE),
        'rightKnee': get(Landmarks.RIGHT_KNEE),
        'leftAnkle': get(Landmarks.LEFT_ANKLE),
        'rightAnkle': get(Landmarks.RIGHT_ANKLE),
        'leftShoulder_vis': get_visibility(Landmarks.LEFT_SHOULDER),
        'rightShoulder_vis': get_visibility(Landmarks.RIGHT_SHOULDER),
        'leftHip_vis': get_visibility(Landmarks.LEFT_HIP),
        'rightHip_vis': get_visibility(Landmarks.RIGHT_HIP),
        'leftKnee_vis': get_visibility(Landmarks.LEFT_KNEE),
        'rightKnee_vis': get_visibility(Landmarks.RIGHT_KNEE),
        'leftAnkle_vis': get_visibility(Landmarks.LEFT_ANKLE),
        'rightAnkle_vis': get_visibility(Landmarks.RIGHT_ANKLE),
    }


def analyze_frame(landmarks: dict, timestamp: float) -> Optional[dict]:
    """
    Analyze a single frame and compute biomechanical metrics.

    Args:
        landmarks: Dictionary of key landmarks
        timestamp: Frame timestamp in seconds

    Returns:
        Frame analysis result or None if detection failed
    """
    # Check visibility thresholds
    min_visibility = 0.5
    key_vis = [
        landmarks['leftHip_vis'], landmarks['rightHip_vis'],
        landmarks['leftKnee_vis'], landmarks['rightKnee_vis'],
        landmarks['leftAnkle_vis'], landmarks['rightAnkle_vis']
    ]

    if any(v < min_visibility for v in key_vis):
        return None

    # Calculate metrics
    cog_height = calculate_center_of_gravity_height(
        landmarks['leftHip'], landmarks['rightHip'],
        landmarks['leftAnkle'], landmarks['rightAnkle']
    )

    tilt_angle = calculate_body_tilt_angle(
        landmarks['leftShoulder'], landmarks['rightShoulder'],
        landmarks['leftHip'], landmarks['rightHip']
    )

    left_knee_flexion = calculate_knee_flexion(
        landmarks['leftHip'], landmarks['leftKnee'], landmarks['leftAnkle']
    )

    right_knee_flexion = calculate_knee_flexion(
        landmarks['rightHip'], landmarks['rightKnee'], landmarks['rightAnkle']
    )

    return {
        'timestamp': timestamp,
        'landmarks': {
            'leftShoulder': {'x': float(landmarks['leftShoulder'][0]), 'y': float(landmarks['leftShoulder'][1]), 'z': float(landmarks['leftShoulder'][2]), 'visibility': landmarks['leftShoulder_vis']},
            'rightShoulder': {'x': float(landmarks['rightShoulder'][0]), 'y': float(landmarks['rightShoulder'][1]), 'z': float(landmarks['rightShoulder'][2]), 'visibility': landmarks['rightShoulder_vis']},
            'leftHip': {'x': float(landmarks['leftHip'][0]), 'y': float(landmarks['leftHip'][1]), 'z': float(landmarks['leftHip'][2]), 'visibility': landmarks['leftHip_vis']},
            'rightHip': {'x': float(landmarks['rightHip'][0]), 'y': float(landmarks['rightHip'][1]), 'z': float(landmarks['rightHip'][2]), 'visibility': landmarks['rightHip_vis']},
            'leftKnee': {'x': float(landmarks['leftKnee'][0]), 'y': float(landmarks['leftKnee'][1]), 'z': float(landmarks['leftKnee'][2]), 'visibility': landmarks['leftKnee_vis']},
            'rightKnee': {'x': float(landmarks['rightKnee'][0]), 'y': float(landmarks['rightKnee'][1]), 'z': float(landmarks['rightKnee'][2]), 'visibility': landmarks['rightKnee_vis']},
            'leftAnkle': {'x': float(landmarks['leftAnkle'][0]), 'y': float(landmarks['leftAnkle'][1]), 'z': float(landmarks['leftAnkle'][2]), 'visibility': landmarks['leftAnkle_vis']},
            'rightAnkle': {'x': float(landmarks['rightAnkle'][0]), 'y': float(landmarks['rightAnkle'][1]), 'z': float(landmarks['rightAnkle'][2]), 'visibility': landmarks['rightAnkle_vis']},
        },
        'metrics': {
            'centerOfGravityHeight': round(cog_height, 3),
            'bodyTiltAngle': round(tilt_angle, 1),
            'leftKneeFlexion': round(left_knee_flexion, 1),
            'rightKneeFlexion': round(right_knee_flexion, 1),
        }
    }


def get_model_path() -> str:
    """Get the path to the pose landmarker model."""
    # Look for model in the same directory as this script
    script_dir = Path(__file__).parent
    model_path = script_dir / 'models' / 'pose_landmarker.task'

    if model_path.exists():
        return str(model_path)

    # Fall back to current directory
    return 'pose_landmarker.task'


def create_pose_landmarker() -> vision.PoseLandmarker:
    """
    Create and return a MediaPipe PoseLandmarker using the Tasks API.

    Returns:
        Configured PoseLandmarker instance
    """
    model_asset_path = get_model_path()

    base_options = python.BaseOptions(model_asset_path=model_asset_path)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        min_pose_presence_confidence=0.5,
    )

    return vision.PoseLandmarker.create_from_options(options)


def analyze_video(
    video_path: str,
    sampling_interval: float = 0.5,
    output_path: Optional[str] = None
) -> dict:
    """
    Analyze a ski video and extract pose data.

    Args:
        video_path: Path to the video file
        sampling_interval: Time interval between samples in seconds
        output_path: Optional path to save JSON output

    Returns:
        Pose analysis result dictionary
    """
    # Open video
    video_capture = cv2.VideoCapture(video_path)
    if not video_capture.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = video_capture.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * sampling_interval)
    total_frames = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / fps if fps > 0 else 0

    print(f"Video: {video_path}")
    print(f"FPS: {fps:.2f}, Total frames: {total_frames}, Duration: {video_duration:.2f}s")
    print(f"Sampling interval: {sampling_interval}s, Frame interval: {frame_interval}")

    # Initialize MediaPipe PoseLandmarker
    pose_landmarker = create_pose_landmarker()

    frames_data: List[dict] = []
    frame_count = 0
    analyzed_count = 0

    while video_capture.isOpened():
        success, image = video_capture.read()
        if not success:
            break

        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Calculate timestamp in milliseconds
        timestamp_ms = int(frame_count * 1000 / fps) if fps > 0 else 0

        # Process with MediaPipe
        mp_img = mp_image.Image(image_format=mp_image.ImageFormat.SRGB, data=image_rgb)
        results = pose_landmarker.detect_for_video(mp_img, timestamp_ms)

        # Sample frame at interval
        if frame_count % frame_interval == 0:
            timestamp = frame_count / fps if fps > 0 else 0

            if results.pose_landmarks and len(results.pose_landmarks) > 0:
                landmarks = extract_key_landmarks(results.pose_landmarks[0])

                frame_result = analyze_frame(landmarks, timestamp)
                if frame_result:
                    frames_data.append(frame_result)
                    analyzed_count += 1

        frame_count += 1

        # Progress update every 100 frames
        if frame_count % 100 == 0:
            print(f"Processed {frame_count}/{total_frames} frames...")

    video_capture.release()

    # Calculate summary statistics
    if frames_data:
        cog_heights = [f['metrics']['centerOfGravityHeight'] for f in frames_data]
        tilt_angles = [abs(f['metrics']['bodyTiltAngle']) for f in frames_data]
        left_knees = [f['metrics']['leftKneeFlexion'] for f in frames_data]
        right_knees = [f['metrics']['rightKneeFlexion'] for f in frames_data]

        # Calculate asymmetry (difference between left and right)
        asymmetries = [
            abs(f['metrics']['leftKneeFlexion'] - f['metrics']['rightKneeFlexion'])
            for f in frames_data
        ]

        summary = {
            'avgCenterOfGravityHeight': round(sum(cog_heights) / len(cog_heights), 3),
            'minCenterOfGravityHeight': round(min(cog_heights), 3),
            'maxBodyTilt': round(max(tilt_angles), 1) if tilt_angles else 0,
            'avgKneeFlexion': round((sum(left_knees) + sum(right_knees)) / (2 * len(left_knees)), 1),
            'leftRightAsymmetry': round(sum(asymmetries) / len(asymmetries), 1),
            'framesAnalyzed': len(frames_data),
            'videoDuration': round(video_duration, 2),
        }
    else:
        summary = {
            'avgCenterOfGravityHeight': 0,
            'minCenterOfGravityHeight': 0,
            'maxBodyTilt': 0,
            'avgKneeFlexion': 0,
            'leftRightAsymmetry': 0,
            'framesAnalyzed': 0,
            'videoDuration': round(video_duration, 2),
        }

    result = {
        'frames': frames_data,
        'summary': summary,
        'metadata': {
            'videoFileName': Path(video_path).name,
            'samplingInterval': sampling_interval,
            'modelType': 'mediapipe_pose_tasks_api',
            'processedAt': __import__('datetime').datetime.now().isoformat(),
        }
    }

    # Save to output file if specified
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Results saved to: {output_path}")

    print(f"Analysis complete: {analyzed_count} frames analyzed")
    return result


def extract_frame_at_timestamp(
    video_path: str,
    timestamp_seconds: float,
    output_path: Optional[str] = None,
    width: int = 640
) -> Dict[str, Any]:
    """
    Extract a single frame at the specified timestamp.

    Args:
        video_path: Path to video file
        timestamp_seconds: Time in seconds to extract frame
        output_path: Optional path to save the frame
        width: Output frame width (maintain aspect ratio)

    Returns:
        Dictionary with frame info and image data
    """
    video_capture = cv2.VideoCapture(video_path)

    if not video_capture.isOpened():
        return {
            "success": False,
            "timestamp": timestamp_seconds,
            "error": f"Could not open video file: {video_path}"
        }

    fps = video_capture.get(cv2.CAP_PROP_FPS)
    total_frames = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration = total_frames / fps if fps > 0 else 0

    # Validate timestamp
    if timestamp_seconds < 0 or timestamp_seconds >= video_duration:
        video_capture.release()
        return {
            "success": False,
            "timestamp": timestamp_seconds,
            "error": f"Timestamp {timestamp_seconds}s is out of video range (0-{video_duration:.2f}s)"
        }

    frame_number = int(timestamp_seconds * fps)
    video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    success, image = video_capture.read()
    video_capture.release()

    if not success:
        return {
            "success": False,
            "timestamp": timestamp_seconds,
            "error": "Failed to extract frame from video"
        }

    # Resize for consistent display
    aspect_ratio = image.shape[0] / image.shape[1]
    height = int(width * aspect_ratio)
    image_resized = cv2.resize(image, (width, height))

    # Encode as base64 for easy transport
    _, buffer = cv2.imencode('.jpg', image_resized, [cv2.IMWRITE_JPEG_QUALITY, 85])
    base64_image = base64.b64encode(buffer).decode('utf-8')

    result: Dict[str, Any] = {
        "success": True,
        "timestamp": timestamp_seconds,
        "width": width,
        "height": height,
        "imageBase64": f"data:image/jpeg;base64,{base64_image}",
        "imageSize": len(base64_image)
    }

    if output_path:
        cv2.imwrite(output_path, image_resized)
        result["savedPath"] = output_path

    return result


def extract_keyframes(
    video_path: str,
    timestamps: List[float],
    output_dir: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Extract multiple keyframes at specified timestamps.

    Args:
        video_path: Path to video file
        timestamps: List of timestamps in seconds
        output_dir: Optional directory to save frames

    Returns:
        List of keyframe dictionaries
    """
    keyframes: List[Dict[str, Any]] = []

    for i, ts in enumerate(timestamps):
        output_path = None
        if output_dir:
            output_path = str(Path(output_dir) / f"keyframe_{i:03d}_{ts:.2f}.jpg")

        frame = extract_frame_at_timestamp(video_path, ts, output_path)
        keyframes.append(frame)

        if frame["success"]:
            print(f"Extracted keyframe at {ts:.2f}s -> {output_path or 'base64'}")
        else:
            print(f"Failed to extract keyframe at {ts:.2f}s: {frame.get('error')}")

    return keyframes


def format_timestamp(seconds: float) -> str:
    """Format seconds to MM:SS format."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Ski Analysis Pose Detection')
    parser.add_argument('--input', '-i', required=True, help='Input video path')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--interval', '-t', type=float, default=0.5,
                        help='Sampling interval in seconds (default: 0.5)')
    parser.add_argument('--keyframes', '-k', type=str,
                        help='Comma-separated timestamps for keyframe extraction (e.g., "3.5,8.2,12.0")')
    parser.add_argument('--keyframes-output', '-ko',
                        help='Output directory for keyframe screenshots')

    args = parser.parse_args()

    try:
        result = analyze_video(args.input, args.interval, args.output)
        print(f"\nSummary:")
        print(f"  Frames analyzed: {result['summary']['framesAnalyzed']}")
        print(f"  Avg COG height: {result['summary']['avgCenterOfGravityHeight']}m")
        print(f"  Max body tilt: {result['summary']['maxBodyTilt']}°")
        print(f"  Avg knee flexion: {result['summary']['avgKneeFlexion']}°")
        print(f"  Left/right asymmetry: {result['summary']['leftRightAsymmetry']}°")

        # Extract keyframes if requested
        if args.keyframes:
            timestamps = [float(t.strip()) for t in args.keyframes.split(',')]
            print(f"\nExtracting {len(timestamps)} keyframes...")
            keyframes = extract_keyframes(args.input, timestamps, args.keyframes_output)

            # Add keyframes to result
            result['keyframes'] = keyframes

            # Save keyframe metadata
            if args.output:
                keyframe_meta_path = Path(args.output).with_suffix('.keyframes.json')
                with open(keyframe_meta_path, 'w', encoding='utf-8') as f:
                    json.dump(keyframes, f, indent=2, ensure_ascii=False)
                print(f"Keyframe metadata saved to: {keyframe_meta_path}")

            successful = sum(1 for k in keyframes if k.get('success'))
            print(f"Successfully extracted {successful}/{len(timestamps)} keyframes")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
