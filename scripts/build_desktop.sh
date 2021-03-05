#!/bin/bash
set -euxo pipefail

echo "Building Desktop"

IFS='|' read -a desktop_config <<< "${CONFIG_DESKTOP}"
touch ${DESKTOP_ROOT}/.env &&
  printf '%s\n' "${desktop_config[@]}" > ${DESKTOP_ROOT}/.env &&
  echo ${DESKTOP_ROOT}/.env

if [[ $1 == "build-only" ]]; then
    yarn --cwd ${DESKTOP_ROOT} run package-win
else
    RELEASE_BRANCH_PREFIX="release-desktop-"
    BUILD_FOLDER="${CI_BRANCH:${#RELEASE_BRANCH_PREFIX}}"
    echo "Publishing to ${BUILD_FOLDER}"
    S3_BUILD_PATH="desktop-app/${BUILD_FOLDER}" yarn --cwd ${DESKTOP_ROOT} run package-and-publish-win
fi

./scripts/pack.sh desktop
