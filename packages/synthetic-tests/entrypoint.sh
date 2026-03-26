#!/usr/bin/env bash
set -euo pipefail

: "${TARGETS:?TARGETS env var is required (comma-separated URLs)}"

ARTILLERY=/app/node_modules/.bin/artillery
SCENARIOS=/app/packages/synthetic-tests/src/merged-scenarios.yml
POLL_INTERVAL="${POLL_INTERVAL:-10}"

IFS=',' read -ra TARGET_LIST <<< "$TARGETS"

trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; echo "$s"; }

wait_for_target() {
  local target="$1"
  echo "Waiting for ${target}/api to be ready..."
  until curl -sf "${target}/api" > /dev/null 2>&1; do
    sleep "$POLL_INTERVAL"
  done
  echo "${target} is ready"
}

for i in "${!TARGET_LIST[@]}"; do
  TARGET_LIST[$i]="$(trim "${TARGET_LIST[$i]}")"
done

for target in "${TARGET_LIST[@]}"; do
  wait_for_target "$target"
done

while true; do
  for target in "${TARGET_LIST[@]}"; do
    echo "=== Running artillery against ${target} ==="
    "$ARTILLERY" run "$SCENARIOS" --target="$target" || echo "Artillery run against ${target} exited with code $?"
  done
  echo "=== Cycle complete, restarting ==="
done
