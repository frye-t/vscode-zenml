#!/usr/bin/env bash
set -euxo pipefail

# Source directory for Python tool
python_src="bundled/tool"

echo "Formatting Python files in bundled/tool..."
find $python_src -name "*.py" -print0 | xargs -0 autoflake --in-place --remove-all-unused-imports
find $python_src -name "*.py" -print0 | xargs -0 isort --
find $python_src -name "*.py" -print0 | xargs -0 black --line-length 100 --

echo "Formatting TypeScript files..."
npx prettier --ignore-path .gitignore --write "**/*.+(ts|json)"

echo "Formatting complete."
