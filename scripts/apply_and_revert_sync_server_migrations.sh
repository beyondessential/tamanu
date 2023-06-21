#!/bin/bash
set -euxo pipefail

yarn workspace sync-server run build
yarn workspace sync-server run start migrate up
yarn workspace sync-server run start migrate downToLastReversibleMigration
