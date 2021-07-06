#!/bin/bash
set -euxo pipefail
echo ${LAN_ROOT}

if [ -z "$LAN_ROOT" ]; then
  echo "Fatal error: LAN_ROOT not set."
  exit 1
fi

# build the app
rm -rf ${LAN_ROOT}/release && mkdir ${LAN_ROOT}/release
yarn workspace lan run build
cp ${LAN_ROOT}/.bin/*.node ${LAN_ROOT}/release/
cp ${LAN_ROOT}/start.bat ${LAN_ROOT}/release/

# copy config files
mkdir ${LAN_ROOT}/release/config
shopt -s extglob
cp ${LAN_ROOT}/config/!(local).json ${LAN_ROOT}/release/config/

# set up data directory
# TODO: this line can be removed once sqlite support is discontinued
mkdir ${LAN_ROOT}/release/data && touch ${LAN_ROOT}/release/data/.keep

${LAN_ROOT}/.bin/msi-packager \
  ${LAN_ROOT}/release \
  ${LAN_ROOT}/release/setup.msi \
  --name 'Tamanu LAN Server' \
  --version 0.0.1 \
  --manufacturer 'beyondessential.com.au' \
  --upgrade-code 'ABCD-EFGH-IJKL' \
  --icon "${LAN_ROOT}/app/assets/images/logo.ico" \
  --executable "server.exe" \
  --local true
