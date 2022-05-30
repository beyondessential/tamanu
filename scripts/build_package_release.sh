#!/bin/bash
set -euxo pipefail

# This script is a workaround to isolate a package from yarn's workspaces.
#
# It works by copying a workspace into a folder yarn doesn't recognise as
# a workspace, then building its dependencies again.

RELEASE_DIR="${RELEASE_DIR:-release-nodejs}"
WORKSPACE="${1?must specify a workspace}"

shopt -s extglob

# build sync bundle
yarn workspace "$WORKSPACE" build

# copy workspace into release dir
pushd "./packages/$WORKSPACE"
rm -rf "./$RELEASE_DIR"
mkdir -p "./$RELEASE_DIR"
cp -R $WORKSPACE.pm2.config.js dist config package.json ../../yarn.lock "./$RELEASE_DIR"
rm -rf "${RELEASE_DIR}/config/"{development,test,local}".json"

pushd "$RELEASE_DIR"
# run yarn install now that we're not in a known workspace
yarn install --non-interactive --production --frozen-lockfile
popd

# copy across shared
cp -R ../shared "./$RELEASE_DIR/node_modules/"
