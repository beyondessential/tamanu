#!/bin/bash
echo "Pushing to S3"
ls ./deploy

MAYBE_VERSION="$(jq '.version' ./package.json --raw-output)"
VERSION="${MAYBE_VERSION?could not calculate version}"

TRUNCATED_BRANCH=${CI_BRANCH%%'-'*}
S3DIR=tamanu-${TRUNCATED_BRANCH}/${VERSION}
aws s3 cp ./deploy/ s3://${S3_BUCKET}/${S3DIR} --recursive --no-progress
