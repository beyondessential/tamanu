#!/bin/bash
set -euxo pipefail
type=$1
echo "Zipping packages for ${type}"
rm -rf deploy
mkdir -p deploy
PREFIX=$(date '+%Y%m%d')-
SUFFIX=-$type-$CI_BRANCH-${CI_COMMIT_ID: -8}

(cd ${DESKTOP_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}desktop${SUFFIX}.zip . ../config \
  && echo "${DEPLOY_DIR}/${PREFIX}desktop${SUFFIX}.zip generated")
(cd ${LAN_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/${PREFIX}lan${SUFFIX}.zip . \
  && echo "${DEPLOY_DIR}/${PREFIX}lan${SUFFIX}.zip generated")
zip -q -x packages/server/node_modules/**\* data/**\* \
  -r ${DEPLOY_DIR}/${PREFIX}server${SUFFIX}.zip packages/server packages/shared packages/scripts package.json yarn.lock babel.config.js\
  && echo "${DEPLOY_DIR}/${PREFIX}server${SUFFIX}.zip generated"
