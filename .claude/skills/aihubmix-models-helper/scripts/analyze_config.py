#!/usr/bin/env python3
"""
Analyze current model configuration against aihubmix API.
Usage: python3 scripts/analyze_config.py
       python3 scripts/analyze_config.py --diff
       python3 scripts/analyze_config.py --update
"""

import json
import os
import sys
import urllib.request

# Paths - Go up from scripts/ to skill dir, then to project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(SKILL_DIR)))
MODELS_FILE = os.path.join(PROJECT_ROOT, "lib", "api", "aihubmix", "models.ts")
API_URL = "https://aihubmix.com/api/v1/models"
CACHE_FILE = os.path.join(os.path.dirname(__file__), ".cache", "models.json")


def get_api_models():
    """Fetch models from aihubmix API."""
    try:
        with urllib.request.urlopen(API_URL, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"API Error: {e}")
        return None


def get_cached_models():
    """Get models from cache."""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def parse_current_models():
    """Parse current models.ts to extract configured models."""
    if not os.path.exists(MODELS_FILE):
        print(f"Error: {MODELS_FILE} not found")
        return {}

    with open(MODELS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract model IDs from the file
    import re

    # Match patterns like: id: 'gpt-4o', or id: "gpt-4o",
    model_ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", content)

    return model_ids


def analyze_config(api_models):
    """Analyze current configuration against API."""
    current_models = parse_current_models()
    api_data = api_models.get("data", [])
    api_models_dict = {m["model_id"]: m for m in api_data}

    print("=" * 70)
    print("Model Configuration Analysis")
    print("=" * 70)
    print()
    print(f"Currently configured models: {len(current_models)}")
    print(f"Models in aihubmix catalog: {len(api_data)}")
    print()

    thinking_models = []
    non_thinking_models = []

    print("-" * 70)
    print("Model Status")
    print("-" * 70)

    for model_id in current_models:
        if model_id in api_models_dict:
            api_model = api_models_dict[model_id]
            features = api_model.get("features", "")
            supports_thinking = "thinking" in features

            if supports_thinking:
                thinking_models.append(model_id)
                status = "✅"
            else:
                non_thinking_models.append(model_id)
                status = "❌"

            print(f"{status} {model_id:35} -> thinking: {supports_thinking}")
        else:
            print(f"⚠️  {model_id:35} -> NOT FOUND in API")

    print()
    print("-" * 70)
    print("Summary")
    print("-" * 70)
    print(f"Support thinking ({len(thinking_models)}): {', '.join(thinking_models)}")
    print(f"Don't support thinking ({len(non_thinking_models)}): {', '.join(non_thinking_models)}")

    return {
        "thinking": thinking_models,
        "non_thinking": non_thinking_models
    }


def generate_config_update(api_models):
    """Generate updated model configuration."""
    current_models = parse_current_models()
    api_data = api_models.get("data", [])
    api_models_dict = {m["model_id"]: m for m in api_data}

    print()
    print("-" * 70)
    print("Suggested Updates for models.ts")
    print("-" * 70)
    print()

    for model_id in current_models:
        if model_id in api_models_dict:
            api_model = api_models_dict[model_id]
            features = api_model.get("features", "")
            supports_thinking = "thinking" in features

            if supports_thinking:
                print(f"  {model_id}: supportsThinking: true,")
        else:
            print(f"  # {model_id}: NOT FOUND in API")


def main():
    print("=" * 70)
    print("Aihubmix Model Configuration Analyzer")
    print("=" * 70)
    print()

    # Get models data
    models_data = get_cached_models()

    if "--update" in sys.argv or not models_data:
        print("Fetching latest models from API...")
        models_data = get_api_models()
        if models_data:
            # Save to cache
            os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(models_data, f, indent=2)
            print("Cache updated!")
        else:
            sys.exit(1)

    if not models_data:
        print("No model data available")
        sys.exit(1)

    # Analyze
    result = analyze_config(models_data)

    if "--diff" in sys.argv:
        generate_config_update(models_data)


if __name__ == "__main__":
    main()
