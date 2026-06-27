#!/bin/bash
# Setup script to enable git hooks for Atheon-Benchmark
# Run this once after cloning the repository

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/..")"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

echo "Setting up git hooks for Atheon-Benchmark..."

# Check if running from the right directory
if [ ! -d "$REPO_ROOT/.git" ]; then
    echo "Error: This script must be run from the repository root"
    echo "Run: bash scripts/enable-hooks.sh"
    exit 1
fi

# Make hooks executable
chmod +x "$GITHOOKS_DIR"/commit-msg
chmod +x "$GITHOOKS_DIR"/pre-commit
chmod +x "$GITHOOKS_DIR"/pre-push

# Create symlinks for each hook
ln -sf "$GITHOOKS_DIR/commit-msg" "$HOOKS_DIR/commit-msg"
ln -sf "$GITHOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
ln -sf "$GITHOOKS_DIR/pre-push" "$HOOKS_DIR/pre-push"

echo "Git hooks have been enabled!"
echo ""
echo "Active hooks:"
ls -la "$HOOKS_DIR/commit-msg" "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-push" 2>/dev/null | grep -v "^total" || true
echo ""
echo "To verify hooks are active, run: git status"
