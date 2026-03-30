#!/usr/bin/env bash
set -euo pipefail

ARTILLERY=/app/node_modules/.bin/artillery
SCENARIO_DIR=/app/packages/synthetic-tests/src
POLL_INTERVAL="${POLL_INTERVAL:-10}"
CYCLE_DELAY="${CYCLE_DELAY:-60}"
MAX_WAIT="${MAX_WAIT:-300}"

FACILITY_TARGETS="${FACILITY_TARGETS:-}"
CENTRAL_TARGETS="${CENTRAL_TARGETS:-}"

if [[ -z "$FACILITY_TARGETS" && -z "$CENTRAL_TARGETS" ]]; then
  echo "ERROR: At least one of FACILITY_TARGETS or CENTRAL_TARGETS must be set" >&2
  exit 1
fi

if [[ -n "$FACILITY_TARGETS" && ! -f "$SCENARIO_DIR/merged-facility.yml" ]]; then
  echo "ERROR: FACILITY_TARGETS is set but $SCENARIO_DIR/merged-facility.yml does not exist" >&2
  exit 1
fi

if [[ -n "$CENTRAL_TARGETS" && ! -f "$SCENARIO_DIR/merged-central.yml" ]]; then
  echo "ERROR: CENTRAL_TARGETS is set but $SCENARIO_DIR/merged-central.yml does not exist" >&2
  exit 1
fi

trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; echo "$s"; }

wait_for_target() {
  local target="$1"
  local elapsed=0
  echo "Waiting for ${target}/api to be ready..."
  until curl -sf "${target}/api" > /dev/null 2>&1; do
    if (( elapsed >= MAX_WAIT )); then
      echo "ERROR: ${target} not ready after ${MAX_WAIT}s" >&2
      exit 1
    fi
    sleep "$POLL_INTERVAL"
    (( elapsed += POLL_INTERVAL ))
  done
  echo "${target} is ready"
}

parse_targets() {
  local raw="$1"
  local -n arr=$2
  IFS=',' read -ra arr <<< "$raw"
  for i in "${!arr[@]}"; do
    arr[$i]="$(trim "${arr[$i]}")"
  done
}

declare -a facility_list=()
declare -a central_list=()

[[ -n "$FACILITY_TARGETS" ]] && parse_targets "$FACILITY_TARGETS" facility_list
[[ -n "$CENTRAL_TARGETS" ]] && parse_targets "$CENTRAL_TARGETS" central_list

for target in "${facility_list[@]}" "${central_list[@]}"; do
  wait_for_target "$target"
done

while true; do
  for target in "${facility_list[@]}"; do
    echo "=== Running facility scenarios against ${target} ==="
    "$ARTILLERY" run "$SCENARIO_DIR/merged-facility.yml" --target="$target" || echo "Artillery run against ${target} exited with code $?"
  done
  for target in "${central_list[@]}"; do
    echo "=== Running central scenarios against ${target} ==="
    "$ARTILLERY" run "$SCENARIO_DIR/merged-central.yml" --target="$target" || echo "Artillery run against ${target} exited with code $?"
  done
  echo "=== Cycle complete, sleeping ${CYCLE_DELAY}s ==="
  sleep "$CYCLE_DELAY"
done
