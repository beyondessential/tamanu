#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
shopt -s extglob

common() {
  # let build-tooling be installed in production mode
  cp package.json{,.working}
  jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.working > package.json
  rm package.json.working

  # put cache in packages/ so it's carried between stages
  npm config set cache /app/packages/.npm

  # install dependencies
  npm install --no-interactive --package-lock
}

remove_irrelevant_packages() {
  # remove from npm workspace list all packages that aren't the ones we're building
  cp package.json{,.working}
  scripts/list-packages.mjs -- --no-shared -- --paths \
    | tee debug.json \
    | jq \
      --arg wanted "$1" \
      '(. - ["packages/\($wanted)"])' \
    > /tmp/unwanted.json || true
    if [[ ! -s /tmp/unwanted.json ]]; then
      stat debug.json || true
      cat debug.json || true
      exit 1
    fi

  # erase from the package.json
  jq \
    --slurpfile unwanted /tmp/unwanted.json \
    '.workspaces.packages -= $unwanted' \
    package.json.working > package.json.new
  # erase from the filesystem
  rm -rf $(jq -r '.[]' /tmp/unwanted.json)
  rm -rf packages/.new-package

  mv package.json.new package.json
  rm package.json.working
}

build_server() {
  # clear out the tests and files not useful for production
  rm -rf packages/*/__tests__ || true
  rm -rf packages/*/jest.* || true
  rm -rf packages/*/docker || true
  rm -rf packages/*/coverage || true
  rm -rf packages/*/config/{local,development,test}.* || true

  # build the world
  npm run build

  remove_irrelevant_packages "$package"

  # clear out the build-tooling
  rm -rf node_modules/@tamanu/build-tooling
  rm -rf packages/build-tooling
  rm -rf packages/**/node_modules/@tamanu/build-tooling

  # clear out the build configs
  rm -rf packages/*/*.config.* || true

  # remove build-tooling from top package.json
  cp package.json{,.working}
  jq '.dependencies |= del(."@tamanu/build-tooling") | .workspaces.packages -= ["packages/build-tooling"]' \
    package.json.working > package.json
  rm package.json.working

  # remove build dependencies
  npm install --no-interactive --package-lock

  # cleanup
  npm cache clean --force
  rm -rf packages/.npm || true
  rm $0
}

build_web() {
  npm run build-shared
  npm run build --workspace @tamanu/web-frontend
  scripts/precompress-assets.sh packages/web/dist
}

build_patient_portal() {
  npm run build-shared
  npm run build --workspace @tamanu/patient-portal
  scripts/precompress-assets.sh packages/patient-portal/dist
}

package="${1:?Expected target or package path}"

common

case "$package" in
  web)
    build_web
    ;;
  patient-portal)
    build_patient_portal
    ;;
  *)
    build_server
    ;;
esac
