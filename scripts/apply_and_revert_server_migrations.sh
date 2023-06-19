#!/bin/bash
set -euxo pipefail

server="${1:?Missing package}"
yarn workspace $server run build
yarn workspace $server run start migrate up
yarn workspace $server run start migrate downToLastReversibleMigration
