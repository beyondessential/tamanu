#!/bin/bash
set -euxo pipefail
cd "$(realpath $(dirname "$(realpath "$BASH_SOURCE")")/..)"

BUCKET_DIR="${1:?Must pass a bucket directory like dev, staging}"
ENV_NAME="${2:?Must pass an environment like tamanu-meta-server-dev}"
scripts/deploy_eb.sh "./packages/meta-server/release-nodejs" "$META_SERVER_EB_APP" "$ENV_NAME" "$META_SERVER_EB_S3/$BUCKET_DIR"
