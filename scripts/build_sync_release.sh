#!/bin/bash
set -euxo pipefail

RELEASE_DIR=release

# build sync bundle
yarn workspace sync-server build

# copy sync workspace into release dir
pushd "$SYNC_SERVER_ROOT"
rm -rf "./$RELEASE_DIR"
mkdir -p "./$RELEASE_DIR"
cp -R ./[!"$RELEASE_DIR"]* "./$RELEASE_DIR"

# run yarn install now that we're not in a known workspace
pushd "$RELEASE_DIR"
yarn install --non-interactive --production
popd

# copy across shared
cp -R ../shared "./$RELEASE_DIR/node_modules/"
