#!/usr/bin/env bash

SERVER_OVERRIDE_PATH=../serverOverrides.json
if [[ ! -z "$SERVER_OVERRIDES" ]]; then
    echo "Outputting server overrides to $(readlink -f $"SERVER_OVERRIDE_PATH")"
    echo "$SERVER_OVERRIDES" > "$SERVER_OVERRIDE_PATH"
fi
