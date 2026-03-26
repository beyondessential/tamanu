#!/usr/bin/env bash
set -euo pipefail

: "${TARGETS:?TARGETS env var is required (comma-separated URLs)}"

ARTILLERY=/app/node_modules/.bin/artillery
SCENARIOS=/app/packages/synthetic-tests/src/merged-scenarios.yml
POLL_INTERVAL="${POLL_INTERVAL:-10}"

IFS=',' read -ra TARGET_LIST <<< "$TARGETS"

wait_for_target() {
  local target="$1"
  echo "Waiting for ${target}/api to be ready..."
  until curl -sf "${target}/api" > /dev/null 2>&1; do
    sleep "$POLL_INTERVAL"
  done
  echo "${target} is ready"
}

for target in "${TARGET_LIST[@]}"; do
  target="${target## }"
  target="${target%% }"
  wait_for_target "$target"
done

while true; do
  for target in "${TARGET_LIST[@]}"; do
    target="${target## }"
    target="${target%% }"
    echo "=== Running artillery against ${target} ==="
    "$ARTILLERY" run "$SCENARIOS" --target="$target" || echo "Artillery run against ${target} exited with code $?"
  done
  echo "=== Cycle complete, restarting ==="
done
