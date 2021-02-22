#!/bin/bash
set -euxo pipefail
type=$1
echo "Zipping packages for ${type}"
rm -rf deploy
mkdir -p deploy
PREFIX=$(date '+%Y%m%d')-tamanu-
SUFFIX=-$type-$CI_BRANCH-${CI_COMMIT_ID: -8}

(cd ${DESKTOP_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}desktop${SUFFIX}.zip . \
  && echo "${DEPLOY_DIR}/${PREFIX}desktop${SUFFIX}.zip generated")

(cd ${LAN_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}lan${SUFFIX}.zip . \
  && echo "${DEPLOY_DIR}/${PREFIX}lan${SUFFIX}.zip generated")
