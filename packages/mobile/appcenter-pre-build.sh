#!/usr/bin/env bash
set -euxo pipefail

cd "$(dirname "$BASH_SOURCE")/../"

echo "Building @tamanu/constants..."
cd constants
npm run build


SERVER_OVERRIDE_PATH=./serverOverrides.json
if [[ -n "${SERVER_OVERRIDES:-}" ]]; then
    # sed because the server overrides are coming through quoted for some reason
    sed 's/\\"/"/gi' <<< "$SERVER_OVERRIDES" > "$SERVER_OVERRIDE_PATH"
fi
