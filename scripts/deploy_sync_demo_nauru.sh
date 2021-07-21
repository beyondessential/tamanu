#!/bin/bash
set -euxo pipefail

codeship_aws eb_deploy "./packages/sync-server/release" "$SYNC_SERVER_EB_APP" "$SYNC_SERVER_EB_ENV_DEMO_NAURU" "$SYNC_SERVER_EB_S3_DEMO_NAURU"
