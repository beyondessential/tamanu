#!/usr/bin/env bash

VERSION=$1

if [ -z "$VERSION" ]; then
  cat << EOF
This script sets all the relevant version numbers in the repo 

Usage:
$ ./scripts/version.sh 1.2.3
EOF
  exit 1
fi

TEMP_PATH=/tmp/package_json_version_bump
version() {
  echo "  $1"
  cat $1 | jq '.version = $v' --arg v $VERSION > $TEMP_PATH
  mv $TEMP_PATH $1
}

echo "Bumping package.jsons to $VERSION"
version package.json
version packages/desktop/package.json
version packages/desktop/app/package.json
version packages/sync-server/package.json
version packages/lan/package.json
version packages/shared-src/package.json
version packages/meta-server/package.json
version packages/scripts/package.json
