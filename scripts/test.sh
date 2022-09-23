#!/bin/bash
set -euo pipefail

runtest() {
  workspace="${1:?required}"
  shard="${2:-'1/1'}"

  echo "=== Running tests in $workspace (shard $shard)"
  NODE_OPTIONS="--max-old-space-size=8192" \
  yarn workspace $workspace \
    run test \
    --shard="$shard"
  echo "==============================="
  echo
}

echo "Running tests"
for workspace in shared-src lan sync-server meta-server; do
  if [[ "$workspace" == "lan" ]]; then
    totalshards=3
  else
    totalshards=1
  fi

  for shard in $(seq 1 $totalshards); do
    runtest $workspace $shard/$totalshards
  done
done

