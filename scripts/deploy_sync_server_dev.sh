#!/bin/bash -uexo pipefail
codeship_aws eb_deploy . "$SYNC_SERVER_EB_APP" "$SYNC_SERVER_EB_ENV" "$SYNC_SERVER_EB_S3" | sed "/^\s*adding:/d"
