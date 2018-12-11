#!/bin/bash
type=$1
type=${type^^}
lan_config="LAN_CONFIG_$type"
server_config="SERVER_CONFIG_$type"
echo "Building for (${type})"

echo "${DESKTOP_CONFIG}" > ${DESKTOP_ROOT}/.env
printf '%s\n' "${!lan_config}" > ${LAN_ROOT}/config.json
printf '%s\n' "${!server_config}" > ${SERVER_ROOT}/config.json

yarn --cwd ${DESKTOP_ROOT} run package
yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh ${type}