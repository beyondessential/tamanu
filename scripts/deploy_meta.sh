#!/bin/bash
set -euxo pipefail

EB_ENV="${1:?Must pass an EB environment}"
echo codeship_aws eb_deploy "./packages/meta-server/release" "$META_SERVER_EB_APP" "${META_SERVER_EB_APP}-${EB_ENV}" "${META_SERVER_EB_S3}/${EB_ENV}"
