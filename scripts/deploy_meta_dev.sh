#!/bin/bash
set -euxo pipefail

codeship_aws eb_deploy "./packages/meta-server/release" "$META_SERVER_EB_APP" "$META_SERVER_EB_ENV_DEV" "$META_SERVER_EB_S3_DEV"
