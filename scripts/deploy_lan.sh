#!/bin/bash
set -euxo pipefail
cd "$(realpath $(dirname "$(realpath "$BASH_SOURCE")")/..)"

echo "folder ./packages/lan/release-nodejs/dist"
for eachfile in "./packages/lan/release-nodejs/dist"
do
   echo $eachfile
done

FACILITY_DESKTOP_UPGRADE_DIR="./packages/lan/release-nodejs/dist/upgrade"
cd "$FACILITY_DESKTOP_UPGRADE_DIR"
ls -l

BUCKET_DIR="${1:?Must pass a bucket directory like dev, staging}"
ENV_NAME="${2:?Must pass an environment like tamanu-central-server-dev}"
scripts/deploy_eb.sh "./packages/lan/release-nodejs" "$LAN_SERVER_EB_APP" "$ENV_NAME" "$LAN_SERVER_EB_S3/$BUCKET_DIR"
