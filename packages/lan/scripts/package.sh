#!/bin/bash
set -euxo pipefail
echo ${LAN_ROOT}

if [ -z "$LAN_ROOT" ]; then
  echo "Fatal error: LAN_ROOT not set."
  exit 1
fi

rm -rf ${LAN_ROOT}/release && mkdir ${LAN_ROOT}/release
yarn workspace lan run build
cp ${LAN_ROOT}/.bin/*.node ${LAN_ROOT}/release/
mkdir ${LAN_ROOT}/release/config && cp ${LAN_ROOT}/config/*.json ${LAN_ROOT}/release/config/
mkdir ${LAN_ROOT}/release/data && touch ${LAN_ROOT}/release/data/.keep

# include demo data in non-master builds
if [ "$CI_BRANCH" != "master" ]; then
  cp ${LAN_ROOT}/data/*.xlsx ${LAN_ROOT}/release/data/.
fi

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
