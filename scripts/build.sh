#!/bin/bash
set -euxo pipefail
node --version
echo "Building"

IFS='|' read -a desktop_config <<< "${CONFIG_DESKTOP}"
touch ${DESKTOP_ROOT}/.env &&
  printf '%s\n' "${desktop_config[@]}" > ${DESKTOP_ROOT}/.env &&
  echo ${DESKTOP_ROOT}/.env

yarn --cwd ${DESKTOP_ROOT} run package-win
