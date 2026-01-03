#!/usr/bin/env python3
"""
Check if a model supports thinking mode.
Usage: python3 scripts/check_thinking.py <model_id>
       python3 scripts/check_thinking.py --all
"""

import json
import os
import sys
import urllib.request

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_FILE = os.path.join(SCRIPT_DIR, ".cache", "models.json")
API_URL = "https://aihubmix.com/api/v1/models"


def get_models_from_api():
    """Fetch models from aihubmix API."""
    try:
        with urllib.request.urlopen(API_URL, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"API Error: {e}")
        return None


def get_models_from_cache():
    """Get models from local cache."""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def check_model(model_id, models_data):
    """Check if a specific model supports thinking mode."""
    models = models_data.get("data", [])

    for model in models:
        if model.get("model_id") == model_id:
            features = model.get("features", "")
            supports_thinking = "thinking" in features

            print("=" * 60)
            print(f"Model: {model_id}")
            print("=" * 60)
            print(f"Status: {'✅ SUPPORTS' if supports_thinking else '❌ NOT SUPPORTED'} thinking mode")
            print(f"Features: {features}")
            print()
            print(f"Description: {model.get('desc', 'N/A')[:200]}...")
            print()
            print(f"Pricing: Input=${model.get('pricing', {}).get('input', 'N/A')}/1M, Output=${model.get('pricing', {}).get('output', 'N/A')}/1M")
            print(f"Max Output: {model.get('max_output', 'N/A')} tokens")
            print(f"Context Length: {model.get('context_length', 'N/A')} tokens")

            return supports_thinking

    print(f"Model '{model_id}' not found in aihubmix catalog")
    return None


def list_thinking_models(models_data):
    """List all models that support thinking mode."""
    models = models_data.get("data", [])
    thinking_models = [m for m in models if "thinking" in m.get("features", "")]

    print("=" * 60)
    print(f"Models Supporting Thinking Mode ({len(thinking_models)} total)")
    print("=" * 60)
    print()

    for model in thinking_models[:50]:  # Limit to 50 for display
        print(f"  • {model['model_id']}")

    if len(thinking_models) > 50:
        print(f"  ... and {len(thinking_models) - 50} more")

    return thinking_models


def main():
    # Handle --update flag first
    if "--update" in sys.argv:
        print("Fetching latest models from API...")
        models_data = get_models_from_api()
        if models_data:
            # Save to cache
            os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(models_data, f, indent=2)
            print("Cache updated!")
            # Show summary
            list_thinking_models(models_data)
        else:
            sys.exit(1)
        return

    if len(sys.argv) < 2:
        print("Usage: python3 scripts/check_thinking.py <model_id>")
        print("       python3 scripts/check_thinking.py --all")
        print("       python3 scripts/check_thinking.py --update")
        sys.exit(1)

    # Get models data (prefer cache, fallback to API)
    models_data = get_models_from_cache()

    if not models_data:
        print("No cached data. Use --update to fetch from API.")
        sys.exit(1)

    if sys.argv[1] == "--all":
        list_thinking_models(models_data)
    else:
        model_id = sys.argv[1]
        check_model(model_id, models_data)


if __name__ == "__main__":
    main()
