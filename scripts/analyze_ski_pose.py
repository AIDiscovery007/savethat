#!/usr/bin/env python3
"""
Ski Pose Analysis CLI

Analyze ski videos and extract pose data for AI coaching.

Usage:
    python scripts/analyze_ski_pose.py -i video.mp4 -o pose_data.json
    python scripts/analyze_ski_pose.py -i video.mp4 --interval 0.3
    python scripts/analyze_ski_pose.py -i video.mp4 -o pose_data.json --verbose
    python scripts/analyze_ski_pose.py -i video.mp4 -k 3.5,8.2 -ko /tmp/keyframes
"""

import argparse
import sys
import importlib.util
from pathlib import Path


# Dynamically import the pose_analyzer module
def load_pose_analyzer():
    script_dir = Path(__file__).parent.parent
    pose_analyzer_path = script_dir / "lib" / "ski-analysis" / "pose_analyzer.py"

    spec = importlib.util.spec_from_file_location("pose_analyzer", pose_analyzer_path)
    if spec is None or spec.loader is None:
        raise ImportError("Cannot load pose_analyzer module")

    module = importlib.util.module_from_spec(spec)
    sys.modules["pose_analyzer"] = module
    spec.loader.exec_module(module)
    return module


pose_analyzer = load_pose_analyzer()
analyze_video = pose_analyzer.analyze_video
extract_keyframes = pose_analyzer.extract_keyframes


def format_pose_for_llm(result: dict) -> str:
    """Format pose analysis result as readable text for LLM."""
    lines = ["=== 姿态分析数据 (POSE DATA) ==="]

    # Frame data
    for frame in result["frames"]:
        timestamp = frame["timestamp"]
        metrics = frame["metrics"]

        # Interpret COG height
        if metrics["centerOfGravityHeight"] < 0.3:
            cog_desc = "很低（深蹲姿态）"
        elif metrics["centerOfGravityHeight"] < 0.5:
            cog_desc = "适中"
        else:
            cog_desc = "较高（站姿偏高）"

        # Interpret tilt
        tilt = metrics["bodyTiltAngle"]
        if tilt > 10:
            tilt_desc = f"左倾 {tilt:.1f}°（过度左倾）"
        elif tilt > 3:
            tilt_desc = f"左倾 {tilt:.1f}°（适合左转弯）"
        elif tilt < -10:
            tilt_desc = f"右倾 {abs(tilt):.1f}°（过度右倾）"
        elif tilt < -3:
            tilt_desc = f"右倾 {abs(tilt):.1f}°（适合右转弯）"
        else:
            tilt_desc = f"接近中立位（{tilt:.1f}°）"

        # Interpret knee flexion
        avg_knee = (metrics["leftKneeFlexion"] + metrics["rightKneeFlexion"]) / 2
        if avg_knee < 90:
            knee_desc = "折叠很深"
        elif avg_knee < 110:
            knee_desc = "折叠适中"
        elif avg_knee < 130:
            knee_desc = "折叠较浅"
        else:
            knee_desc = "接近伸直"

        asymmetry = abs(metrics["leftKneeFlexion"] - metrics["rightKneeFlexion"])
        if asymmetry > 15:
            asymmetry_desc = f"左右差异大（{asymmetry:.1f}°）"
        elif asymmetry > 5:
            asymmetry_desc = f"左右略有差异（{asymmetry:.1f}°）"
        else:
            asymmetry_desc = "左右对称"

        lines.append(f"\n第 {timestamp:.1f} 秒：")
        lines.append(
            f"  - 重心高度: {metrics['centerOfGravityHeight']:.3f}m ({cog_desc})"
        )
        lines.append(f"  - 身体倾斜: {tilt_desc}")
        lines.append(f"  - 膝盖状态: {knee_desc}")
        lines.append(
            f"  - 左膝: {metrics['leftKneeFlexion']:.0f}°, 右膝: {metrics['rightKneeFlexion']:.0f}° ({asymmetry_desc})"
        )

    # Summary
    summary = result["summary"]
    lines.append("\n=== 统计摘要 ===")
    lines.append(f"  平均重心高度: {summary['avgCenterOfGravityHeight']:.3f}m")
    lines.append(f"  最低重心高度: {summary['minCenterOfGravityHeight']:.3f}m")
    lines.append(f"  最大身体倾斜: {summary['maxBodyTilt']:.1f}°")
    lines.append(f"  平均膝盖折叠: {summary['avgKneeFlexion']:.1f}°")
    lines.append(f"  左右不对称度: {summary['leftRightAsymmetry']:.1f}°")
    lines.append(f"  有效分析帧数: {summary['framesAnalyzed']}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Ski Pose Analysis - Extract biomechanical data from ski videos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument("-i", "--input", required=True, help="Input video file path")
    parser.add_argument("-o", "--output", help="Output JSON file path (optional)")
    parser.add_argument(
        "-t",
        "--interval",
        type=float,
        default=0.5,
        help="Sampling interval in seconds (default: 0.5)",
    )
    parser.add_argument(
        "-f",
        "--format",
        choices=["json", "text", "both"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "-k",
        "--keyframes",
        type=str,
        help="Comma-separated timestamps for keyframe extraction (e.g., '3.5,8.2,12.0')",
    )
    parser.add_argument(
        "-ko",
        "--keyframes-output",
        help="Output directory for keyframe screenshots (optional, defaults to temp)",
    )

    args = parser.parse_args()

    # Verify input file exists
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Analyzing: {input_path}")
        print(f"Interval: {args.interval}s")

    try:
        # Run analysis (don't save output yet if we need to add keyframes)
        result = analyze_video(
            str(input_path),
            sampling_interval=args.interval,
            output_path=None,  # Don't save inside analyze_video
        )

        # Extract keyframes if requested
        keyframes_result = []
        if args.keyframes:
            timestamps = [float(t.strip()) for t in args.keyframes.split(',')]
            print(f"\nExtracting {len(timestamps)} keyframes at timestamps: {args.keyframes}")
            keyframes_result = extract_keyframes(str(input_path), timestamps, args.keyframes_output)
            result['keyframes'] = keyframes_result
            successful = sum(1 for k in keyframes_result if k.get('success'))
            print(f"Successfully extracted {successful}/{len(timestamps)} keyframes")

        # Save output files (after keyframes are added)
        if args.output and args.format in ["json", "both"]:
            import json
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"Results saved to: {args.output}")

        if args.format in ["text", "both"]:
            text_output = format_pose_for_llm(result)

            if args.format == "both":
                text_path = str(Path(args.output).with_suffix(".txt"))
                with open(text_path, "w", encoding="utf-8") as f:
                    f.write(text_output)
                print(f"Text output saved to: {text_path}")
            else:
                print(text_output)

        # Print summary
        if args.verbose or args.format == "text":
            print(f"\nAnalysis complete!")
            print(f"  Video: {result['metadata']['videoFileName']}")
            print(f"  Frames analyzed: {result['summary']['framesAnalyzed']}")
            print(f"  Avg COG height: {result['summary']['avgCenterOfGravityHeight']}m")
            print(f"  Max body tilt: {result['summary']['maxBodyTilt']}°")
            print(f"  Avg knee flexion: {result['summary']['avgKneeFlexion']}°")
            print(f"  Left/right asymmetry: {result['summary']['leftRightAsymmetry']}°")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
