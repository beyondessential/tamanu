#!/bin/bash
set -euo pipefail

MIGRATION_NAME="${1:?Must provide a migration name}"
TIMESTAMP=$(date +%s000)
MIGRATION_DIR_PATH=packages/shared-src/src/migrations
FILENAME=${MIGRATION_DIR_PATH}/${TIMESTAMP}-${MIGRATION_NAME}.js

cat scripts/resources/serverMigrationTemplate.js > ${FILENAME}

echo "Created new migration ${FILENAME}"
