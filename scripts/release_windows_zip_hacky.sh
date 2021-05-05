#!/bin/bash
set -euxo pipefail

WORKSPACE="${1?must specify a workspace}"

# build release
./scripts/build_shared.sh
./scripts/build_package_release.sh "$WORKSPACE"

# get rid of extraneous junk
pushd "./packages/$WORKSPACE/release"
mv ./node_modules/shared .
rm -rf node_modules coverage index.js pm2.json README.md config/development.json config/test.json data
popd

# zip and rename
pushd "./packages/$WORKSPACE"
MAYBE_VERSION="$(jq '.version' ./package.json --raw-output)"
VERSION="${MAYBE_VERSION?could not calculate version}"
DIR_NAME="release-v$VERSION"
ZIP_NAME="$WORKSPACE-v$VERSION.zip"
mv release "$DIR_NAME"
zip -r "$ZIP_NAME" "$DIR_NAME"
rm -rf "$DIR_NAME"
popd

# move to tamanu
mv "./packages/$WORKSPACE/$ZIP_NAME" .
