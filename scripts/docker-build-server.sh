#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
shopt -s extglob
package="${1:-}"

is_building_shared() {
  # we use a function instead of a variable as we're relying on the exit value
  # -z = true if the string is empty
  test -z "$package"
}

# save the original package.jsons
cp package.json{,.orig}

# let build-tooling be installed in production mode
jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.orig > package.json

# put cache in packages/ so it's carried between stages
yarn config set cache-folder /app/packages/.yarn-cache

# install dependencies
yarn install --non-interactive --frozen-lockfile

# if we're building a server package, the shared stage will bring in the builds,
# so we don't need to build shared here, and in the shared stage we don't build
# the server packages, hence this neat branching logic here
if is_building_shared; then
  yarn workspace @tamanu/shared build
else
  # clear out the tests and files not useful for production
  rm -rf packages/*/__tests__ || true
  rm -rf packages/*/jest.* || true
  rm -rf packages/*/docker || true
  rm -rf packages/*/coverage || true
  rm -rf packages/*/config/{local,development,test}.* || true

  yarn workspace "$package" build
fi

# clean up when building a server package
#
# otherwise we assume we're building the shared stage, and we either want to
# keep some of these, or we don't care to clean up as the multi-staging will
# take care of skipping the cruft anyway
if ! is_building_shared; then
  # clear out the build-tooling
  rm -rf node_modules/@tamanu/build-tooling
  rm -rf packages/build-tooling
  rm -rf packages/**/node_modules/@tamanu/build-tooling

  # clear out the build configs
  rm -rf packages/*/*.config.* || true

  # restore the top level package.json
  mv package.json{.orig,}

  # cleanup
  yarn cache clean
  yarn config delete cache-folder
  rm -rf packages/.yarn-cache || true
  rm $0
fi
