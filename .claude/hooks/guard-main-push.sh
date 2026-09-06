#!/bin/bash
# guard-main-push.sh
# Claude Code PreToolUse hook — blocks `git push` to main unless explicitly confirmed.
# Place this file at: .claude/hooks/guard-main-push.sh (inside your project repo)
# Make executable: chmod +x .claude/hooks/guard-main-push.sh

# Claude Code passes the tool call info as JSON on stdin
input=$(cat)

# Extract the command Claude is about to run (adjust jq path if your Claude Code
# version nests fields differently — check with: echo "$input" | jq .)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Only act on bash commands that look like a git push
if echo "$command" | grep -qE '^\s*git\s+push'; then

  # Detect current branch
  current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

  # Detect if this push targets main (explicitly, or implicitly if current branch is main)
  targets_main=false
  if echo "$command" | grep -qE '(^|\s)(origin\s+)?main(\s|$)'; then
    targets_main=true
  elif [ "$current_branch" = "main" ]; then
    targets_main=true
  fi

  if [ "$targets_main" = true ]; then
    # Block the tool call and ask Claude to get explicit user confirmation first.
    # Exit code 2 = deny the tool call in Claude Code hook protocol.
    echo "BLOCKED: This command pushes to 'main', which is connected to the live Vercel deployment." >&2
    echo "Do not run this push. Instead, stop and ask the user to explicitly confirm" >&2
    echo "they want to deploy to production before retrying. All regular development" >&2
    echo "should happen on 'develop' — push there instead unless the user has just confirmed." >&2
    exit 2
  fi
fi

# Anything else (including pushes to develop/feature branches) passes through normally
exit 0