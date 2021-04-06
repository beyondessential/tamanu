#!/bin/bash
set -euxo pipefail

LAN_OR_DESKTOP=$1

echo "Zipping ${LAN_OR_DESKTOP}"
PREFIX=$(date '+%Y%m%d')-tamanu-
SUFFIX=-$CI_BRANCH-${CI_COMMIT_ID: -8}
[[ $LAN_OR_DESKTOP = "lan" ]] && RELEASE_DIR="$LAN_RELEASE_DIR" || RELEASE_DIR="$DESKTOP_RELEASE_DIR"

(cd ${RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}${LAN_OR_DESKTOP}${SUFFIX}.zip . \
  && echo "${DEPLOY_DIR}/${PREFIX}${LAN_OR_DESKTOP}${SUFFIX}.zip generated")
