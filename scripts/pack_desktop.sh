#!/bin/bash
set -euxo pipefail

echo "Zipping desktop"
VERSION="$(jq .version "packages/desktop/package.json" -r)"
SUFFIX="$CI_BRANCH-v$VERSION-${CI_COMMIT_ID:0:10}"
DESTINATION="${DEPLOY_DIR}/tamanu-desktop-${SUFFIX}.zip"

(cd ${DESKTOP_RELEASE_DIR} \
  && zip -q -r "${DESTINATION}" . \
  && echo "${DESTINATION} generated")
