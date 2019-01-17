#!/bin/bash
type=$1
type_upper=${type^^}
branch=${CI_BRANCH}
branch_upper=${branch^^}
lan_config="CONFIG_LAN_${type_upper}_${branch_upper}"
server_config="CONFIG_SERVER_${type_upper}_${branch_upper}"
echo "Building - ${type}"

touch ${DESKTOP_ROOT}/.env &&
  echo "${CONFIG_DESKTOP}" > ${DESKTOP_ROOT}/.env &&
  echo ${DESKTOP_ROOT}/.env

mkdir -p ${LAN_ROOT}/config/ &&
  touch ${LAN_ROOT}/config/default.json &&
  printf '%s\n' "${!lan_config}" > ${LAN_ROOT}/config/default.json &&
  echo ${LAN_ROOT}/config/default.json

mkdir -p ${SERVER_ROOT}/config/ &&
  touch ${SERVER_ROOT}/config/production.json &&
  printf '%s\n' "${!server_config}" > ${SERVER_ROOT}/config/production.json &&
  echo ${SERVER_ROOT}/config/production.json

yarn --cwd ${DESKTOP_ROOT} run package-all
yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh ${type}