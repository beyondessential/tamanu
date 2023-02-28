#!/bin/bash
set -euxo pipefail

CODE_PATH="${1:?Must pass the path of the code to deploy}"
EB_APP="${2:?Must pass an EB application}"
EB_ENV="${3:?Must pass an EB environment}"
S3_PATH="${4:?Must pass an S3 path}"

function get_version {
    aws elasticbeanstalk describe-environments \
        --application-name "$EB_APP" \
        --environment-names "$EB_ENV" | \
        jq -r '.Environments[0].VersionLabel'
}

OLD_VERSION="$(get_version)"

codeship_aws eb_deploy "$CODE_PATH" "$EB_APP" "$EB_ENV" "$S3_PATH" ||
    "$(dirname $0)/eb_wait_until_healthy.sh" "$EB_APP" "$EB_ENV"
NEW_VERSION="$(get_version)"

if [[ "$NEW_VERSION" == "$OLD_VERSION" ]]; then
    echo 'Version did not change'
    exit 1
fi
