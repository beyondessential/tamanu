#!/bin/bash
set -euxo pipefail

LAN_OR_DESKTOP=$1

echo "Zipping ${LAN_OR_DESKTOP}"
PREFIX="$(date '+%Y%m%d')-tamanu-"
VERSION="$(jq .version "packages/$LAN_OR_DESKTOP/package.json" -r)"
SUFFIX="-$CI_BRANCH-$VERSION-${CI_COMMIT_ID: -8}"
[[ $LAN_OR_DESKTOP = "lan" ]] && RELEASE_DIR="$LAN_RELEASE_DIR" || RELEASE_DIR="$DESKTOP_RELEASE_DIR"

(cd ${RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}${LAN_OR_DESKTOP}${SUFFIX}.zip . \
  && echo "${DEPLOY_DIR}/${PREFIX}${LAN_OR_DESKTOP}${SUFFIX}.zip generated")
