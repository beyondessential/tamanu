#!/bin/bash
set -euxo pipefail

server="${1:?Missing package}"
# Servers run from TypeScript source via the tsx loader.
npm run --workspace @tamanu/$server start upgrade
npm run --workspace @tamanu/$server start just-migrate downToLastReversibleMigration
