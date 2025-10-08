#!/bin/bash
set -euxo pipefail

server="${1:?Missing package}"
npm run --workspace @tamanu/$server build
npm run --workspace @tamanu/$server start upgrade
npm run --workspace @tamanu/$server start just-migrate downToLastReversibleMigration
