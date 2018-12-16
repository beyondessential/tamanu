#!/bin/bash
type=$1
type_upper=${type^^}
lan_config="${type_upper}_LAN_CONFIG"
server_config="${type_upper}_SERVER_CONFIG"
echo "Building - ${type}"

echo "${DESKTOP_CONFIG}" > ${DESKTOP_ROOT}/.env
printf '%s\n' "${!lan_config}" > ${LAN_ROOT}/config.json
printf '%s\n' "${!server_config}" > ${SERVER_ROOT}/config.json

yarn --cwd ${DESKTOP_ROOT} run package
yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh ${type}