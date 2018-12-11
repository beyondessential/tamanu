#!/bin/bash
type=$1
type=${type^^}

echo "Zipping packages for ${type}"
rm -rf deploy
mkdir -p deploy
(cd ${DESKTOP_RELEASE_DIR} \
  && TYPE=$type zip -q -r ${DEPLOY_DIR}/desktop-$type-$CI_BRANCH-$CI_COMMIT_ID.zip .)
(cd ${LAN_RELEASE_DIR} \
  && TYPE=$type zip -q -r ${DEPLOY_DIR}/lan-$type-$CI_BRANCH-$CI_COMMIT_ID.zip .)
TYPE=$type zip -q \
  -x packages/server/app/**/ \
  packages/server/app/**/* \
  -r ${DEPLOY_DIR}/server-$type-$CI_BRANCH-$CI_COMMIT_ID.zip \
  packages/server \
  packages/shared \
  package.json \
  yarn.lock
