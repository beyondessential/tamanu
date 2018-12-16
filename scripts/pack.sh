#!/bin/bash
type=$1
echo "Zipping packages for ${type}"
rm -rf deploy
mkdir -p deploy
(cd ${DESKTOP_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/desktop-$type-$CI_BRANCH-$CI_COMMIT_ID.zip . \
  && echo "${DEPLOY_DIR}/desktop-$type-$CI_BRANCH-$CI_COMMIT_ID.zip generated")
(cd ${LAN_RELEASE_DIR} \
  && zip -q -r ${DEPLOY_DIR}/lan-$type-$CI_BRANCH-$CI_COMMIT_ID.zip . \
  && echo "${DEPLOY_DIR}/lan-$type-$CI_BRANCH-$CI_COMMIT_ID.zip generated")
zip -q -x packages/server/node_modules/**\* data/**\* \
  -r server-$type-$CI_BRANCH-$CI_COMMIT_ID.zip packages/server packages/shared yarn.lock \
  && echo "server-$type-$CI_BRANCH-$CI_COMMIT_ID.zip generated"
