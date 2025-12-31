#!/usr/bin/env python3
"""
Next.js 16 Code Analyzer

Scans TypeScript/React files for common bugs and anti-patterns.
"""

import re
import sys
from pathlib import Path

# Common bug patterns
PATTERNS = {
    "any_type": {
        "pattern": r":\s*any\b",
        "message": "Avoid using 'any' type - specify proper types",
        "severity": "warning"
    },
    "use_effect_missing_deps": {
        "pattern": r"useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\}\s*,\s*\[\s*\]\s*\)",
        "message": "useEffect with empty deps[] may have missing dependencies",
        "severity": "warning"
    },
    "window_in_server": {
        "pattern": r"window\.(localStorage|sessionStorage|location)",
        "message": "window usage in server code - check for browser environment",
        "severity": "error"
    },
    "random_in_component": {
        "pattern": r"Math\.random\(\)",
        "message": "Math.random() causes hydration mismatch - use useId()",
        "severity": "error"
    },
    "missing_use_client": {
        "pattern": r"(onClick|onChange|useState|useRef|useEffect)\s*\(",
        "message": "Client-side hooks used - may need 'use client' directive",
        "severity": "warning"
    },
    "async_without_await": {
        "pattern": r"async\s+function\s+\w+\s*\([^)]*\)\s*\{[^}]*\breturn\s+\w+\.json\(\)[^}]*\}",
        "message": "Async function returning .json() - check if awaiting",
        "severity": "warning"
    },
    "or_for_nullish": {
        "pattern": r"[^?]||\s*['\"]",
        "message": "Using || for potentially null values - use ?? instead",
        "severity": "info"
    },
}


def analyze_file(file_path: Path) -> list[dict]:
    """Analyze a single file for common issues."""
    issues = []

    if not file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
        return issues

    try:
        content = file_path.read_text()
        lines = content.split('\n')
    except Exception as e:
        return [{"file": str(file_path), "message": f"Cannot read file: {e}", "severity": "error"}]

    for name, config in PATTERNS.items():
        for i, line in enumerate(lines, 1):
            if re.search(config["pattern"], line):
                issues.append({
                    "file": str(file_path),
                    "line": i,
                    "type": name,
                    "message": config["message"],
                    "severity": config["severity"],
                    "code": line.strip()
                })

    return issues


def analyze_directory(dir_path: Path) -> list[dict]:
    """Analyze all TypeScript/React files in a directory."""
    issues = []

    for ts_file in dir_path.rglob("*.ts"):
        issues.extend(analyze_file(ts_file))

    for tsx_file in dir_path.rglob("*.tsx"):
        issues.extend(analyze_file(tsx_file))

    return issues


def main():
    if len(sys.argv) < 2:
        print("Usage: analyze_code.py <file-or-directory>")
        sys.exit(1)

    path = Path(sys.argv[1])

    if not path.exists():
        print(f"Error: Path does not exist: {path}")
        sys.exit(1)

    if path.is_file():
        issues = analyze_file(path)
    else:
        issues = analyze_directory(path)

    # Output results
    print(f"\n=== Next.js Code Analysis Report ===\n")

    if not issues:
        print("No common issues found!")
        sys.exit(0)

    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]
    infos = [i for i in issues if i["severity"] == "info"]

    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print(f"Info: {len(infos)}\n")

    for issue in issues:
        severity_icon = {"error": "❌", "warning": "⚠️", "info": "ℹ️"}[issue["severity"]]
        print(f"{severity_icon} [{issue['type']}] {issue['file']}:{issue['line']}")
        print(f"   {issue['message']}")
        if "code" in issue:
            print(f"   → {issue['code'][:80]}")
        print()


if __name__ == "__main__":
    main()
