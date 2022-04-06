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

