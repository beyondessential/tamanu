#!/bin/bash
set -euxo pipefail

#
# This script builds a release according to
# https://docs.google.com/document/d/1hzFNpv9VAV9tVa-9H_H7gfjrd-LUmS84oWTM3MBfwBk/edit
#
# Releasing like this is a hack to get around our executable builds not working properly with
# migrations. In an ideal world we'd eventually delete it, as the deployment steps are
# quite manual and introduce moving parts like yarn and npm to the server environment.
#

WORKSPACE="${1?must specify a workspace}"
RELEASE_FOLDER="release-nodejs"

# build release
./scripts/build_shared.sh
./scripts/build_package_release.sh "$WORKSPACE"

# get rid of extraneous junk from the linux release
pushd "./packages/$WORKSPACE/$RELEASE_FOLDER"
mv ./node_modules/shared .
rm -rf node_modules
popd

# zip and rename
pushd "./packages/$WORKSPACE"
MAYBE_VERSION="$(jq '.version' ./package.json --raw-output)"
VERSION="${MAYBE_VERSION?could not calculate version}"
DIR_NAME="release-v$VERSION"
ZIP_NAME="$WORKSPACE-v$VERSION.zip"
mv "$RELEASE_FOLDER" "$DIR_NAME"
zip -r "$ZIP_NAME" "$DIR_NAME"
rm -rf "$DIR_NAME"
popd

# move to tamanu
mv "./packages/$WORKSPACE/$ZIP_NAME" .
