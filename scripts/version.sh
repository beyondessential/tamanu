#!/usr/bin/env bash
set -euo pipefail

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
version packages/shared-src/shared.package.json
version packages/meta-server/package.json
version packages/scripts/package.json
version packages/qr-tester/package.json
version packages/csca/package.json

cat << EOF

Don't forget to manually update:
  - packages/lan/app/middleware/versionCompatibility.js
  - packages/sync-server/app/middleware/versionCompatibility.js
  - packages/mobile/package.json (the patch version of mobile must monotonically increase)
EOF
