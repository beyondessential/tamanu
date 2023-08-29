#!/bin/bash
set -euxo pipefail

## This script is a workaround to isolate a package from the full workspace.
# We create a new minimal workspace with just the shared and the target package,
# and build from there.

set -euxo pipefail
shopt -s extglob

pkg_name="${1?must specify a package}"
RELEASE_DIR="${RELEASE_DIR:-release-nodejs}"
target="$(pwd)/packages/$pkg_name/$RELEASE_DIR"
buildplace=$(mktemp -d)

# copy workspace root and shared into buildplace
cp package.json   "$buildplace/package.json.orig"
jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json > "$buildplace/package.json"
ls -la
cp -R yarn.lock common.tsconfig.json *.config.*   "$buildplace/"
mkdir -p "$buildplace/packages"
cp -R packages/build-tooling packages/shared packages/constants   "$buildplace/packages/"

# copy desired package
cp -R "packages/$pkg_name"   "$buildplace/packages/"

# into the build
pushd "$buildplace"

# clear out the tests and files not useful for production
rm -rf packages/*/__tests__ || true
rm -rf packages/*/jest.* || true
rm -rf packages/*/docker || true
rm -rf packages/*/coverage || true
rm -rf packages/*/config/{development,test,local}.json || true

# do the build
yarn install --non-interactive --production --frozen-lockfile
yarn workspace @tamanu/constants build
yarn workspace @tamanu/shared build
yarn workspace $pkg_name build

# clear out the build-tooling
rm -rf node_modules/@tamanu/build-tooling
rm -rf packages/build-tooling
rm -rf packages/**/node_modules/@tamanu/build-tooling
rm common.tsconfig.json

# clear out the build configs
rm -rf packages/*/*.config.* || true

# restore the top level package.json
mv -v package.json{.orig,}

# compact to a single node_modules
# this is quite hacky but we'll change how this works altogether very soon (SAV-263)
cp -R packages/shared/node_modules/*   node_modules/
rm -rf packages/$pkg_name/node_modules/@tamanu/shared || true
cp -R packages/constants/node_modules/*   node_modules/ || true # doesn't exist yet
rm -rf packages/$pkg_name/node_modules/@tamanu/constants || true
cp -R packages/$pkg_name/node_modules/*   node_modules/
rm -rf packages/$pkg_name/node_modules || true
mv -v node_modules   packages/$pkg_name/node_modules

# move shared into the package
mkdir -p packages/$pkg_name/node_modules/@tamanu
rm -rf packages/$pkg_name/node_modules/@tamanu/shared
mv -v packages/shared   packages/$pkg_name/node_modules/@tamanu/shared
rm -rf packages/$pkg_name/node_modules/@tamanu/constants
mv -v packages/constants   packages/$pkg_name/node_modules/@tamanu/constants

# out of build
popd

# move output to target
rm -rf "$target" || true
mv -v "$buildplace/packages/$pkg_name"   "$target"
