#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
package="${1:-}"

# save the original package.jsons
cp package.json{,.orig}

# let build-tooling be installed in prod mode
jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.orig > package.json

# install dependencies
yarn install --non-interactive --frozen-lockfile

# if we're building a server package, the shared stage will bring in the builds,
# so we don't need to build shared here, and in the shared stage we don't build
# the server packages, hence this neat branching logic here
if [ -z "$package" ]; then
  yarn workspace @tamanu/shared build
else
  yarn workspace "$package" build
fi

# restore the top level package.json
mv package.json{.orig,}

# clear out the build-tooling when building a server package
# otherwise we assume we're building the shared stage, and want to keep these
if ! [ -z "$package" ]; then
  rm -rf node_modules/@tamanu/build-tooling
  rm -rf packages/**/node_modules/@tamanu/build-tooling
  rm -rf packages/build-tooling
fi

# cleanup
yarn cache clean
rm $0
