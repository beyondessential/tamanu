#!/usr/bin/env bash
set -euo pipefail

# Dumps a schema snapshot from an existing fully-migrated database.
# Tests load this snapshot instead of running hundreds of old migrations.
#
# Prerequisites: a fully-migrated PostgreSQL database accessible with the
#                credentials in packages/database/config/local.json
#
# Usage:
#   ./scripts/generate-test-snapshot.sh [database_name]
#
# If database_name is omitted, uses db.name from local.json.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

CONFIG_FILE="packages/database/config/local.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Copy local.example to local.json and configure." >&2
  exit 1
fi

node scripts/generate-test-snapshot.cjs "$@"
