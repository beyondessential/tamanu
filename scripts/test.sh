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

if grep -vE '(master|staging|dev)' <<< "$CI_BRANCH"; then
  echo "Posting coverage to PR"
  export GITHUB_TOKEN=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 # temporary, for demo only!
  node scripts/pr-comment.mjs coverage.md 'Coverage Report' || true
fi
