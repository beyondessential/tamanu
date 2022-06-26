#!/bin/bash
set -euo pipefail

EB_APP="${1:?Must pass an EB application}"
EB_ENV="${2:?Must pass an EB environment}"

WAIT="10" # 10 seconds
# might go slightly over this timeout without more complicated handling
TIMEOUT="300" # 5 minutes

function check_health {
    aws elasticbeanstalk describe-environments \
        --application-name "$EB_APP" \
        --environment-names "$EB_ENV" | \
        jq -r '.Environments[0].Health'
}

function wait_for_green {
    echo "Checking health of app '$EB_APP', env '$EB_ENV'"
    for i in $(seq 0 "$WAIT" "$TIMEOUT"); do
        if [ "$(check_health)" == "Green" ]; then
            echo "Health was green"
            exit 0;
        fi
        echo .
        sleep "$WAIT"
    done
    echo "Timed out waiting for green health"
    exit 1
}

wait_for_green
