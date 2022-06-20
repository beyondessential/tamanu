#!/bin/bash
set -euxo pipefail

ENV_SUFFIX="${1:?Must pass an environment suffix like dev or staging}"
codeship_aws eb_deploy "./packages/meta-server/release-nodejs" "$META_SERVER_EB_APP" "${META_SERVER_EB_APP}-${ENV_SUFFIX}" "${META_SERVER_EB_S3}/${ENV_SUFFIX}"
