#!/usr/bin/env bash
set -euxo pipefail

SERVER_OVERRIDE_PATH=./serverOverrides.json
if [[ ! -z "$SERVER_OVERRIDES" ]]; then
    echo "Outputting server overrides to $SERVER_OVERRIDE_PATH"
    # sed because the server overrides are coming through quoted for some reason
    echo "$SERVER_OVERRIDES" | sed 's/\\"/"/gi' > "$SERVER_OVERRIDE_PATH"
fi
