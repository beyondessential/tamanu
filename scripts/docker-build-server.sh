#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
package="${1:?package name is required}"

# save the original package.jsons
cp package.json{,.orig}

# let build-tooling be installed in prod mode
jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.orig > package.json

# install dependencies
yarn install --non-interactive --frozen-lockfile

# build the shared package
yarn workspace @tamanu/shared build

# build the server package
yarn workspace "$package" build

# restore the top level package.json
mv package.json{.orig,}

# clear out the build-tooling
rm -rf node_modules/@tamanu/build-tooling
rm -rf packages/**/node_modules/@tamanu/build-tooling
rm -rf packages/build-tooling

# cleanup
yarn cache clean
