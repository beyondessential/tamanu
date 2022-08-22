#!/bin/bash
set -euxo pipefail

echo "Zipping desktop"
PREFIX="$(date '+%Y%m%d')-tamanu-"
VERSION="$(jq .version "packages/desktop/package.json" -r)"
SUFFIX="-$CI_BRANCH-$VERSION-${CI_COMMIT_ID: -8}"
DESTINATION="${DEPLOY_DIR}/${PREFIX}desktop${SUFFIX}.zip"

(cd ${DESKTOP_RELEASE_DIR} \
  && zip -q -r "${DESTINATION}" . \
  && echo "${DESTINATION} generated")
