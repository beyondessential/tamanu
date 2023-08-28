#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
shopt -s extglob

is_building_shared() {
  # we use a function instead of a variable as we're relying on the exit value
  # -z = true if the string is empty
  test -z "$package"
}

common() {
  # let build-tooling be installed in production mode
  cp package.json{,.working}
  jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.working > package.json
  rm package.json.working

  # put cache in packages/ so it's carried between stages
  yarn config set cache-folder /app/packages/.yarn-cache

  # install dependencies
  yarn install --non-interactive --frozen-lockfile
}

build_shared() {
  yarn clean
  # as `yarn build-shared` removes anything that's not a dependency of another
  #   package, and when the Dockerfile builds `shared` it removes non-shared
  #   packages, we want to run `yarn build` to ensure every remaining package
  #   is build regardless of whether it appears to be dependent
  yarn build
}

remove_irrelevant_packages() {
  # remove from yarn workspace list all packages that aren't the ones we're building
  cp package.json{,.working}
  scripts/list-packages.mjs --no-shared --paths \
    | jq \
      --slurpfile top package.json.working \
      --arg wanted "$1" \
      '(. - ["packages/\($wanted)"]) as $x | $top[0] | .workspaces.packages -= $x' \
    > package.json.new
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

  remove_irrelevant_packages "$package"

  # build the world
  yarn build

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
  yarn install --non-interactive --frozen-lockfile

  # cleanup
  yarn cache clean
  yarn config delete cache-folder
  rm -rf packages/.yarn-cache || true
  rm $0
}

build_desktop() {
  remove_irrelevant_packages desktop

  # build the world
  yarn build

  # create desktop packaging configs
  cd packages/desktop
  jq '.build.win.target = ["nsis"] | .build.nsis.perMachine = false | .build.directories.output = "release/appdata"' \
    package.json > /package-appdata.json
  jq '.build.win.target = ["msi"] | .build.msi.shortcutName = "Tamanu \(.version)"' \
    package.json > /package-msi.json
  jq '.build.productName = "Tamanu Fiji" | .build.appId = "org.beyondessential.TamanuFiji" | .build.directories.output = "release/aspen"' \
    /package-msi.json > /package-aspen.json
  jq '.build.mac.target = "tar.xz"' \
    package.json > /package-mac.json
}

package="${1:?Expected target or package path}"

common

case "$package" in
  shared)
    build_shared
    ;;
  desktop)
    build_desktop
    ;;
  *)
    build_server
    ;;
esac
