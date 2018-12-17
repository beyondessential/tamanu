#!/bin/bash
type=$1
type_upper=${type^^}
branch=${CI_BRANCH}
branch_upper=${branch^^}
lan_config="CONFIG_LAN_${type_upper}_${branch_upper}"
server_config="CONFIG_SERVER_${type_upper}_${branch_upper}"
echo "Building - ${type}"

echo "${CONFIG_DESKTOP}" > ${DESKTOP_ROOT}/.env
printf '%s\n' "${!lan_config}" > ${LAN_ROOT}/config.json
printf '%s\n' "${!server_config}" > ${SERVER_ROOT}/config.json

yarn --cwd ${DESKTOP_ROOT} run package
yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh ${type}