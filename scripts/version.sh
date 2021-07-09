#!/usr/bin/env bash

# This script outputs all version numbers in the repo 
# so that it's easy to eyeball what needs updating.

# TODO: a function to actually bump the version numbers

V=$1
TEMP_PATH=/tmp/package_json_version_bump

if [ -z "$V" ]; then
  echo "Usage: ./scripts/version.sh 1.2.3"
  exit 1
fi

version() {
  echo "Bumping $1 to $V"
  cat $1 | jq '.version = $v' --arg v $V > $TEMP_PATH
  mv $TEMP_PATH $1
}

version package.json
version packages/desktop/package.json
version packages/desktop/app/package.json
version packages/sync-server/package.json
version packages/lan/package.json
version packages/shared-src/package.json
version packages/meta-server/package.json
version packages/scripts/package.json
