#!/bin/bash
set -euxo pipefail
SYNC_SERVER_EB_APP=tamanu-sync-server
SYNC_SERVER_EB_ENV=tamanu-sync-server-dev
SYNC_SERVER_EB_S3=elasticbeanstalk-ap-southeast-2-843218180240
codeship_aws eb_deploy . "$SYNC_SERVER_EB_APP" "$SYNC_SERVER_EB_ENV" "$SYNC_SERVER_EB_S3" | sed "/^\s*adding:/d"
