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
    # Update desktop's package.json with any deployment-specific adjustments
    node scripts/build_desktop_update_config.mjs
    yarn --cwd ${DESKTOP_ROOT} run package-and-publish-win
fi

./scripts/pack_desktop.sh
