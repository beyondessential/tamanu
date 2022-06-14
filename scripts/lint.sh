#!/bin/bash
set -euo pipefail

echo
echo "Running lints (non-fatal)"
echo

for workspace in shared-src lan sync-server meta-server; do
  echo "=== Running lints in $workspace"
  yarn workspace $workspace \
    run lint \
    --format=json-with-metadata \
    --output-file=lint-summary.json \
  || true
  echo "==============================="
  echo
done

echo "Aggregating lints"
node scripts/aggregate-lints.mjs | tee lints.md

if [[ ! -s "lints.md" ]]; then
  echo "No content in aggregate lint report, this is a hard error"
  # (lints all pass = content in report, no content = something's wrong)
  exit 42
fi

if [[ "${1:-}" == "pr-lints" ]]; then
  echo "Posting lints to PR"
  node scripts/pr-comment.mjs lints.md 'Lint Report' || true
fi
