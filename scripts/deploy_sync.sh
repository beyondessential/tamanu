#!/bin/bash
set -euxo pipefail

ENV_SUFFIX="${1:?Must pass an environment suffix like dev or staging}"
"$(dirname $0)/deploy_eb.sh" "./packages/sync-server/release-nodejs" "$SYNC_SERVER_EB_APP" "$SYNC_SERVER_EB_APP-$ENV_SUFFIX" "$SYNC_SERVER_EB_S3/$ENV_SUFFIX"
