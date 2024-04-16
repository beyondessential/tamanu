#!/bin/bash
set -euxo pipefail

server="${1:?Missing package}"
yarn workspace @tamanu/$server run build
yarn workspace @tamanu/$server run start migrate up
yarn workspace @tamanu/$server run start migrate downToLastReversibleMigration
