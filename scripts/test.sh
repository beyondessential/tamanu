#!/bin/bash
set -euo pipefail

echo "Building shared"
yarn run build-shared

echo "Running tests"
for workspace in shared-src lan sync-server meta-server; do
  echo "Running tests in $workspace"
  yarn workspace $workspace \
    run test-coverage \
    --coverageReporters=json-summary
done

echo "Aggregating coverage"
node scripts/aggregate-coverage.mjs | tee coverage.md

if [[ ! -z "$CI_PR_NUMBER" ]]; then
  echo "Posting coverage to PR"
  export GITHUB_TOKEN=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 # temporary, for demo only!
  node scripts/pr-comment.js coverage.md 'Coverage Report'
fi
