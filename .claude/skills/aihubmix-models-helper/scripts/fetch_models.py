#!/usr/bin/env python3
"""
Fetch latest models from aihubmix API and save to cache.
Usage: python3 scripts/fetch_models.py
"""

import json
import os
import urllib.request
from datetime import datetime

API_URL = "https://aihubmix.com/api/v1/models"
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
CACHE_FILE = os.path.join(CACHE_DIR, "models.json")


def fetch_models():
    """Fetch models from aihubmix API."""
    print(f"Fetching models from: {API_URL}")

    try:
        with urllib.request.urlopen(API_URL, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))

        # Save to cache
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Count models
        models = data.get("data", [])
        print(f"✓ Fetched {len(models)} models")

        # Count thinking support
        thinking_count = sum(1 for m in models if "thinking" in m.get("features", ""))
        print(f"  - {thinking_count} models support thinking mode")

        return data
    except Exception as e:
        print(f"✗ Error fetching models: {e}")
        return None


def get_cached_models():
    """Get models from cache."""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def main():
    print("=" * 60)
    print("Aihubmix Model Fetcher")
    print("=" * 60)
    print()

    # Check for --cache flag
    if "--cache" in sys.argv:
        data = get_cached_models()
        if data:
            print(f"Using cached data ({len(data.get('data', []))} models)")
            return data
        else:
            print("No cached data found")

    data = fetch_models()

    if data:
        print()
        print(f"Cache saved to: {CACHE_FILE}")

    return data


if __name__ == "__main__":
    import sys
    main()
