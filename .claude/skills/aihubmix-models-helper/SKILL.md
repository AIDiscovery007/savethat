---
name: aihubmix-models-helper
description: "Helper for fetching and analyzing aihubmix model information. Use when: (1) Need to check if a model supports thinking mode, (2) Need to fetch latest model list from aihubmix API, (3) Need to verify or update model configurations, (4) Comparing model features across providers."
---

# Aihubmix Models Helper Skill

## Quick Start

### Fetch Latest Model List
Run the script to fetch the latest models from aihubmix:
```bash
scripts/fetch_models.py
```

### Check Thinking Support for a Model
Run the verification script with a model ID:
```bash
scripts/check_thinking.py <model_id>
```

### Analyze Current Configuration
Run analysis against current models.ts:
```bash
scripts/analyze_config.py
```

## Core Functions

### 1. Fetch Model List from API
- Endpoint: `https://aihubmix.com/api/v1/models`
- Returns: All available models with features, pricing, and capabilities

### 2. Check Thinking Support
- Input: Model ID (e.g., `o4-mini`, `gemini-3-pro-preview`)
- Output: Whether the model supports `thinking` mode
- Features checked: Look for `thinking` in model's `features` field

### 3. Compare Models
- Compare features between different models
- Identify which models support specific capabilities (thinking, tools, etc.)

## Common Use Cases

### Validate Model Before Adding
```bash
# Check if model supports thinking before adding to config
python3 scripts/check_thinking.py <model_id>
```

### Update Model Config
1. Fetch latest models: `scripts/fetch_models.py`
2. Compare with current: `scripts/analyze_config.py`
3. Update `lib/api/aihubmix/models.ts` with new `supportsThinking` values

### Check All Configured Models
```bash
python3 scripts/analyze_config.py --all
```

## Script Reference

| Script | Purpose |
|--------|---------|
| `fetch_models.py` | Fetch and cache latest model list from API |
| `check_thinking.py` | Check if a specific model supports thinking |
| `analyze_config.py` | Analyze current model configuration |
| `update_config.py` | Generate updated model configuration |

## API Response Format

```json
{
  "data": [
    {
      "model_id": "o4-mini",
      "features": "thinking,tools,function_calling,structured_outputs",
      "pricing": { "input": 1.1, "output": 4.4 },
      "max_output": 100000,
      "context_length": 200000
    }
  ]
}
```

## Feature Flags

| Feature | Description |
|---------|-------------|
| `thinking` | Extended thinking mode for complex reasoning |
| `tools` | Tool calling capability |
| `function_calling` | Function calling support |
| `structured_outputs` | Structured output generation |
| `web` | Web search capability |
| `deepsearch` | Deep search functionality |
| `long_context` | Extended context window |
