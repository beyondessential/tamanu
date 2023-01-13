#!/bin/bash
set -euxo pipefail
cd "$(realpath $(dirname "$(realpath "$BASH_SOURCE")")/..)"

BUCKET_DIR="${1:?Must pass a bucket directory like dev, staging}"
ENV_NAME="${2:?Must pass an environment like tamanu-central-server-dev}"
scripts/deploy_eb.sh "./packages/lan/release-nodejs" "$LAN_SERVER_EB_APP" "$ENV_NAME" "$LAN_SERVER_EB_S3/$BUCKET_DIR"
