#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PYTHON="${PYTHON:-python3}"

echo "=== Python ==="
"$PYTHON" -m compileall -q run_all.py admin_app tests
"$PYTHON" -m unittest discover -s tests -p 'test_*.py'
if [[ -f admin_app/manage.py ]]; then
  "$PYTHON" admin_app/manage.py check
fi

echo "=== PHP ==="
if command -v php >/dev/null 2>&1; then
  find api -type f -name '*.php' -print0 | while IFS= read -r -d '' f; do php -l "$f"; done
  find tests -maxdepth 1 -type f -name 'test_*.php' -print0 | while IFS= read -r -d '' f; do php "$f"; done
fi

echo "=== Node ==="
if command -v node >/dev/null 2>&1; then
  find tests -maxdepth 1 -type f -name 'test_*.js' -print0 | while IFS= read -r -d '' f; do node "$f"; done
fi
