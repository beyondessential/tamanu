#!/bin/bash
set -euxo pipefail
node --version
type=$1
type_upper=${type^^}
branch=${CI_BRANCH}
branch_upper=${branch^^}
lan_config="CONFIG_LAN_${type_upper}_${branch_upper}"
server_config="CONFIG_SERVER_${type_upper}_${branch_upper}"
echo "Building - ${type}"

IFS='|' read -a desktop_config <<< "${CONFIG_DESKTOP}"
touch ${DESKTOP_ROOT}/.env &&
  printf '%s\n' "${desktop_config[@]}" > ${DESKTOP_ROOT}/.env &&
  echo ${DESKTOP_ROOT}/.env

# mkdir -p ${LAN_ROOT}/config/ &&
  # touch ${LAN_ROOT}/config/local.json &&
  # printf '%s\n' "${!lan_config}" > ${LAN_ROOT}/config/local.json &&
  # echo ${LAN_ROOT}/config/local.json

# mkdir -p ${SERVER_ROOT}/config/ &&
  # touch ${SERVER_ROOT}/config/production.json &&
  # printf '%s\n' "${!server_config}" > ${SERVER_ROOT}/config/production.json &&
  # echo ${SERVER_ROOT}/config/production.json

# yarn --cwd ${DESKTOP_ROOT} run package-win
yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh ${type}
