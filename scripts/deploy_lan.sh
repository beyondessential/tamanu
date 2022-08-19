#!/bin/bash
set -euxo pipefail

BUCKET_DIR="${1:?Must pass a bucket directory like dev, staging}"
ENV_NAME="${2:?Must pass an environment like tamanu-central-server-dev}"
"$(dirname $0)/deploy_eb.sh" "./packages/lan/release-nodejs" "$LAN_SERVER_EB_APP" "$ENV_NAME" "$LAN_SERVER_EB_S3/$BUCKET_DIR"
