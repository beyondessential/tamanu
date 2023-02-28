#!/bin/bash
set -euxo pipefail

WORKSPACE="${1?must specify a workspace}"
LINUX_RELEASE_FOLDER="release-nodejs"
WINDOWS_RELEASE_FOLDER="release-windows"
WINDOWS_RELEASE_DIR="./packages/$WORKSPACE/$WINDOWS_RELEASE_FOLDER"
TARGET_PATH="${2-.}"
RELEASE_NODE_JS_DIR="./packages/$WORKSPACE/$LINUX_RELEASE_FOLDER"
FACILITY_DESKTOP_UPGRADE_DIR="$RELEASE_NODE_JS_DIR/upgrade"
DESKTOP_RELEASE_DIR="./packages/desktop/release"

# this script depends on the following steps having been run:
# ./scripts/build_shared.sh
# ./scripts/build_package_release.sh "$WORKSPACE"

# If package-desktop is true and server is facility then package the latest Tamanu desktop
# along with the server
if [[ $WORKSPACE == "lan" && $3 == "package-desktop" ]]; then
    echo "Packaging desktop with facility server"
    mkdir -p "$FACILITY_DESKTOP_UPGRADE_DIR"
    cp -r "$DESKTOP_RELEASE_DIR/." "$FACILITY_DESKTOP_UPGRADE_DIR"
fi

# copy folder before modifying so we don't break the linux release
cp -r "$RELEASE_NODE_JS_DIR" "$WINDOWS_RELEASE_DIR"

# get rid of node_modules from the copied linux release
pushd "$WINDOWS_RELEASE_DIR"
mv ./node_modules/shared .
rm -rf node_modules
popd

# zip and rename
pushd "./packages/$WORKSPACE"
MAYBE_VERSION="$(jq '.version' ./package.json --raw-output)"
VERSION="${MAYBE_VERSION?could not calculate version}"
DIR_NAME="release-v$VERSION"
SUFFIX="$CI_BRANCH-v$VERSION-${CI_COMMIT_ID:0:10}"
ZIP_NAME="tamanu-$WORKSPACE-$SUFFIX.zip"

mv "$WINDOWS_RELEASE_FOLDER" "$DIR_NAME" 
zip -r "$ZIP_NAME" "$DIR_NAME"
rm -rf "$DIR_NAME"
popd

mkdir -p $TARGET_PATH

# move to tamanu
mv "./packages/$WORKSPACE/$ZIP_NAME" $TARGET_PATH
