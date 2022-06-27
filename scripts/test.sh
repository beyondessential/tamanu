#!/bin/bash
set -euo pipefail

echo "Running tests"
for workspace in shared-src lan sync-server meta-server; do
  echo "=== Running tests in $workspace"
  yarn workspace $workspace \
    run test-coverage \
    --coverageReporters=json-summary
  echo "==============================="
  echo
done

echo "Aggregating coverage"
node scripts/aggregate-coverage.mjs | tee coverage.md

if [[ "${1:-}" == "pr-coverage" ]]; then
  echo "Posting coverage to PR"
  node scripts/pr-comment.mjs coverage.md 'Coverage Report' || true
fi
