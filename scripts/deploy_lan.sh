#!/bin/bash
set -euxo pipefail

EB_ENV="${1:?Must pass an EB environment}"
codeship_aws eb_deploy "./packages/lan/release-nodejs" "$LAN_SERVER_EB_APP" "${LAN_SERVER_EB_APP}-${EB_ENV}" "${LAN_SERVER_EB_S3}/${EB_ENV}"
