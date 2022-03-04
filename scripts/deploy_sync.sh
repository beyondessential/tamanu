#!/bin/bash
set -euxo pipefail

EB_ENV="${1:?Must pass an EB environment}"
codeship_aws eb_deploy "./packages/sync-server/release-nodejs" "$SYNC_SERVER_EB_APP" "${SYNC_SERVER_EB_APP}-${EB_ENV}" "${SYNC_SERVER_EB_S3}/${EB_ENV}"
