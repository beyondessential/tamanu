#!/bin/bash
set -euxo pipefail

WORKSPACE="${1?must specify a workspace}"
RELEASE_FOLDER="release-nodejs"
TARGET_PATH="${2-.}"

mkdir -p ${TARGET_PATH}

echo "TESTING" > $TARGET_PATH/$WORKSPACE.txt

MAYBE_VERSION=1
: <<ignore
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
mv "./packages/$WORKSPACE/$ZIP_NAME" $TARGET_PATH
ignore