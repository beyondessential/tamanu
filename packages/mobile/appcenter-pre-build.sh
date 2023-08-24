#!/usr/bin/env bash
set -euxo pipefail

SERVER_OVERRIDE_PATH=./serverOverrides.json
echo "SERVER_OVERRIDES=$SERVER_OVERRIDES"
echo "cwd is $(pwd)"
if [[ ! -z "$SERVER_OVERRIDES" ]]; then
    echo "Outputting server overrides to $SERVER_OVERRIDE_PATH"
    echo "$SERVER_OVERRIDES" > "$SERVER_OVERRIDE_PATH"
fi
