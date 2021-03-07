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
    BUILD_FOLDER="desktop/${CI_BRANCH:${#RELEASE_BRANCH_PREFIX}}"

    # Replace the publish path in package.json with the build folder
    node -e "
      let pkg=require('./packages/desktop/package.json');     // read in package.json
      pkg.build.publish.path='${BUILD_FOLDER}';               // replace publish path
      require('fs')                                           // write package.json back out
        .writeFileSync(
          'packages/desktop/package.json',
          JSON.stringify(pkg, null, 2)
        );
    "

    echo "Publishing to ${BUILD_FOLDER}"
    yarn --cwd ${DESKTOP_ROOT} run package-and-publish-win
fi

./scripts/pack.sh desktop
