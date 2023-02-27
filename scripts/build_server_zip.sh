#!/bin/bash
set -euxo pipefail

WORKSPACE="${1?must specify a workspace}"
LINUX_RELEASE_FOLDER="release-nodejs"
WINDOWS_RELEASE_FOLDER="release-windows"
TARGET_PATH="${2-.}"

# this script depends on the following steps having been run:
# ./scripts/build_shared.sh
# ./scripts/build_package_release.sh "$WORKSPACE"

# copy folder before modifying so we don't break the linux release
cp -r "./packages/$WORKSPACE/$LINUX_RELEASE_FOLDER" "./packages/$WORKSPACE/$WINDOWS_RELEASE_FOLDER"

# get rid of node_modules from the copied linux release
pushd "./packages/$WORKSPACE/$WINDOWS_RELEASE_FOLDER"
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
DESKTOP_UPGRADE_DIR="$DIR_NAME/dist/upgrade"
mv "$WINDOWS_RELEASE_FOLDER" "$DIR_NAME"

pwd 

# If package-desktop then package the latest Tmanu desktop
# along with the facility server
if [[ $WORKSPACE == "lan" && $3 == "package-desktop" ]]; then
    if [ ! -d "$DESKTOP_RELEASE_DIR" ]; then
        echo "Building desktop"
        ../../scripts/build_desktop.sh build-only
    fi

    echo "Packaging desktop with facility server"
    mkdir -p "$DESKTOP_UPGRADE_DIR"
    cp -r "$DESKTOP_RELEASE_DIR" "$DESKTOP_UPGRADE_DIR"
fi

zip -r "$ZIP_NAME" "$DIR_NAME"
rm -rf "$DIR_NAME"
popd

mkdir -p $TARGET_PATH

# move to tamanu
mv "./packages/$WORKSPACE/$ZIP_NAME" $TARGET_PATH
