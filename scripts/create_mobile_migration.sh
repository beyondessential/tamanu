#!/bin/bash
set -euo pipefail

MIGRATION_NAME="${1:?Must provide a migration name}"
TIMESTAMP=$(date +%s000)
MIGRATION_DIR_PATH=App/migrations
FILENAME=${MIGRATION_DIR_PATH}/${TIMESTAMP}-${MIGRATION_NAME}.ts

sed "s/{MIGRATION_NAME}/${MIGRATION_NAME}/g;s/{TIMESTAMP}/${TIMESTAMP}/g" ${MIGRATION_DIR_PATH}/.migrationTemplate.ts > ${FILENAME}
sed -i.bak "s/^$/import { ${MIGRATION_NAME}${TIMESTAMP} } from \'\.\/${TIMESTAMP}-${MIGRATION_NAME}\'\;\n/g;s/\]\;/  ${MIGRATION_NAME}${TIMESTAMP},\n\]\;/g" ${MIGRATION_DIR_PATH}/index.ts && rm ${MIGRATION_DIR_PATH}/index.ts.bak
echo "Created new migration ${FILENAME}"
