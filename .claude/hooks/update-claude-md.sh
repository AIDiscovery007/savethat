#!/bin/bash
# Auto-update CLAUDE.md based on codebase changes
# Triggered by PostToolUse hook when relevant files are modified

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_MD="$CLAUDE_PROJECT_DIR/CLAUDE.md"
LOG_FILE="$CLAUDE_PROJECT_DIR/.claude/logs/update-claude-md.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if CLAUDE.md exists
if [ ! -f "$CLAUDE_MD" ]; then
    log "CLAUDE.md not found, skipping update"
    exit 0
fi

# Track if we made any changes
CHANGES_MADE=false

#############################################
# Update Tools Registry from registry.ts
#############################################
update_tools_registry() {
    local registry_file="$CLAUDE_PROJECT_DIR/lib/tools/registry.ts"
    local claude_md="$CLAUDE_MD"

    if [ ! -f "$registry_file" ]; then
        log "registry.ts not found"
        return
    fi

    # Check if Tools Registry section exists
    if ! grep -q "^## Tools Registry" "$claude_md"; then
        log "Tools Registry section not found"
        return
    fi

    # Get line number of Tools Registry section
    local start_line
    start_line=$(grep -n "^## Tools Registry" "$claude_md" | head -1 | cut -d: -f1)

    # Create temp file for new tools content
    local tools_temp
    tools_temp=$(mktemp)

    cat > "$tools_temp" << 'EOF'
## Tools Registry

| Tool | Category | Status | Description |
|------|----------|--------|-------------|
EOF

    # Parse tool entries - collect complete tool blocks
    local tool_block=""
    local in_tool=0

    while IFS= read -r line; do
        # Start of tool object
        if [[ "$line" =~ ^[[:space:]]*\{[[:space:]]*$ ]]; then
            in_tool=1
            tool_block="$line"
        elif [ $in_tool -eq 1 ]; then
            tool_block="${tool_block}"$'\n'"$line"
            # End of tool object
            if [[ "$line" =~ ^[[:space:]]*\}[[:space:]]*,?[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*\}[[:space:]]*$ ]]; then
                in_tool=0

                # Extract fields using grep and sed
                local tool_id tool_name tool_category tool_status description

                tool_id=$(echo "$tool_block" | grep -oE "id:[[:space:]]*'[a-z-]+'" | grep -oE "'[a-z-]+'" | tr -d "'")
                if [ -z "$tool_id" ]; then
                    tool_id=$(echo "$tool_block" | grep -oE "id:[[:space:]]*\"[a-z-]+\"" | grep -oE "\"[a-z-]+\"" | tr -d '"')
                fi

                tool_name=$(echo "$tool_block" | grep -oE "name:[[:space:]]*'[^-]+'" | sed "s/name:[[:space:]]*'//" | tr -d "'")
                if [ -z "$tool_name" ]; then
                    tool_name=$(echo "$tool_block" | grep -oE "name:[[:space:]]*\"[^\"]+\"" | sed 's/name:[[:space:]]*"//' | tr -d '"')
                fi

                tool_category=$(echo "$tool_block" | grep -oE "category:[[:space:]]*'[a-z]+'" | grep -oE "'[a-z]+'" | tr -d "'")
                if [ -z "$tool_category" ]; then
                    tool_category=$(echo "$tool_block" | grep -oE "category:[[:space:]]*\"[a-z]+\"" | grep -oE "\"[a-z]+\"" | tr -d '"')
                fi

                tool_status=$(echo "$tool_block" | grep -oE "status:[[:space:]]*'[a-z]+'" | grep -oE "'[a-z]+'" | tr -d "'")
                if [ -z "$tool_status" ]; then
                    tool_status=$(echo "$tool_block" | grep -oE "status:[[:space:]]*\"[a-z]+\"" | grep -oE "\"[a-z]+\"" | tr -d '"')
                fi

                if [ -n "$tool_id" ] && [ -n "$tool_name" ]; then
                    description="${tool_name} tool"
                    case "$tool_id" in
                        "prompt-optimizer")
                            description="Optimize prompts with AI"
                            ;;
                        "ski-analysis")
                            description="Ski technique analysis with pose detection"
                            ;;
                        "audio-transcriber")
                            description="Convert audio to text with AI"
                            ;;
                    esac

                    echo "| \`${tool_id}\` | ${tool_category} | ${tool_status} | ${description} |" >> "$tools_temp"
                fi
                tool_block=""
            fi
        fi
    done < "$registry_file"

    # Replace the section in CLAUDE.md
    local final_temp
    final_temp=$(mktemp)

    head -n "$((start_line - 1))" "$claude_md" > "$final_temp"
    cat "$tools_temp" >> "$final_temp"

    # Find next ## header and append from there
    local next_section
    next_section=$(tail -n "+$((start_line + 1))" "$claude_md" 2>/dev/null | grep -n "^## " | head -1 | cut -d: -f1)
    if [ -n "$next_section" ]; then
        tail -n "+$((start_line + next_section))" "$claude_md" >> "$final_temp"
    fi

    mv "$final_temp" "$claude_md"
    rm -f "$tools_temp"

    CHANGES_MADE=true
    log "Updated Tools Registry section"
}

#############################################
# Update Claude Code Hooks section
#############################################
update_hooks_section() {
    local hooks_dir="$CLAUDE_PROJECT_DIR/.claude/hooks"
    local claude_md="$CLAUDE_MD"

    if [ ! -d "$hooks_dir" ]; then
        log "Hooks directory not found"
        return
    fi

    # Check if Hooks section exists
    if ! grep -q "^### Claude Code Hooks" "$claude_md"; then
        log "Claude Code Hooks section not found"
        return
    fi

    # Get line number of Hooks section
    local start_line
    start_line=$(grep -n "^### Claude Code Hooks" "$claude_md" | head -1 | cut -d: -f1)

    # Create temp file for new hooks content
    local hooks_temp
    hooks_temp=$(mktemp)

    cat > "$hooks_temp" << 'EOF'
### Claude Code Hooks

Hooks are configured in `.claude/settings.json` and scripts reside in `.claude/hooks/`:

| Hook | Trigger | Purpose |
|------|---------|---------|
EOF

    for hook_file in "$hooks_dir"/*.sh; do
        if [ -f "$hook_file" ]; then
            local hook_name
            hook_name=$(basename "$hook_file" .sh)

            local trigger purpose
            case "$hook_name" in
                "tsc-check")
                    trigger="PreToolUse (git commit)"
                    purpose="TypeScript type checking before commit"
                    ;;
                "i18n-check")
                    trigger="PostToolUse (Edit/Write)"
                    purpose="Check i18n translation sync after edits"
                    ;;
                "component-gen")
                    trigger="PostToolUse (Glob new file)"
                    purpose="Auto-generate component template"
                    ;;
                "code-review-trigger")
                    trigger="Stop (task completion)"
                    purpose="Auto-run code review for modified TS files"
                    ;;
                "update-claude-md")
                    trigger="PostToolUse (Write/Edit)"
                    purpose="Auto-update CLAUDE.md when codebase changes"
                    ;;
                *)
                    trigger="Manual"
                    purpose="Custom hook"
                    ;;
            esac

            if [ -n "$purpose" ]; then
                echo "| \`${hook_name}.sh\` | ${trigger} | ${purpose} |" >> "$hooks_temp"
            fi
        fi
    done

    # Replace the section in CLAUDE.md
    local final_temp
    final_temp=$(mktemp)

    head -n "$((start_line - 1))" "$claude_md" > "$final_temp"
    cat "$hooks_temp" >> "$final_temp"

    # Find next ## or ### header and append from there
    local next_section
    next_section=$(tail -n "+$((start_line + 1))" "$claude_md" 2>/dev/null | grep -n "^##\\|^### " | head -1 | cut -d: -f1)
    if [ -n "$next_section" ]; then
        tail -n "+$((start_line + next_section))" "$claude_md" >> "$final_temp"
    fi

    mv "$final_temp" "$claude_md"
    rm -f "$hooks_temp"

    CHANGES_MADE=true
    log "Updated Claude Code Hooks section"
}

#############################################
# Main execution
#############################################
main() {
    log "Starting CLAUDE.md auto-update"

    update_tools_registry
    update_hooks_section

    if [ "$CHANGES_MADE" = true ]; then
        log "CLAUDE.md has been updated"
        echo "CLAUDE.md has been updated"
    else
        log "No changes made to CLAUDE.md"
    fi

    log "Auto-update complete"
}

main "$@"
