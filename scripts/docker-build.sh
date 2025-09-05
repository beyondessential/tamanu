#!/bin/bash

### This expects to be run in the production docker build in /Dockerfile.

set -euxo pipefail
shopt -s extglob

# Add better error reporting
trap 'echo "Error occurred at line $LINENO. Exit code: $?" >&2' ERR

common() {
  echo "Starting common setup..."
  
  # let build-tooling be installed in production mode
  echo "Modifying package.json to include build-tooling..."
  cp package.json{,.working}
  
  # Check if jq is available
  if ! command -v jq &> /dev/null; then
    echo "ERROR: jq is not available in PATH"
    exit 5
  fi
  
  # Validate package.json before processing
  if ! jq empty package.json.working 2>/dev/null; then
    echo "ERROR: package.json.working is not valid JSON"
    cat package.json.working
    exit 5
  fi
  
  jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.working > package.json
  rm package.json.working

  # put cache in packages/ so it's carried between stages
  echo "Setting npm cache location..."
  npm config set cache /app/packages/.npm

  # install dependencies
  echo "Installing dependencies..."
  if ! npm install --no-interactive --package-lock; then
    echo "First npm install failed, trying with --force..."
    npm install --no-interactive --package-lock --force
  fi
  echo "Common setup completed successfully."
}

remove_irrelevant_packages() {
  echo "Removing irrelevant packages for target: $1"
  
  # remove from npm workspace list all packages that aren't the ones we're building
  cp package.json{,.working}
  
  echo "Listing packages to remove..."
  scripts/list-packages.mjs -- --no-shared -- --paths > /tmp/packages_list.json
  
  # Validate the JSON output from list-packages.mjs
  if ! jq empty /tmp/packages_list.json 2>/dev/null; then
    echo "ERROR: list-packages.mjs output is not valid JSON"
    echo "Output was:"
    cat /tmp/packages_list.json
    exit 5
  fi
  
  jq \
    --arg wanted "$1" \
    '(. - ["packages/\($wanted)"])' \
    /tmp/packages_list.json > /tmp/unwanted.json

  echo "Packages to remove:"
  cat /tmp/unwanted.json

  # erase from the package.json
  echo "Updating package.json..."
  
  # Validate package.json.working before processing
  if ! jq empty package.json.working 2>/dev/null; then
    echo "ERROR: package.json.working is not valid JSON in remove_irrelevant_packages"
    cat package.json.working
    exit 5
  fi
  
  jq \
    --slurpfile unwanted /tmp/unwanted.json \
    '.workspaces.packages -= $unwanted' \
    package.json.working > package.json.new
    
  # erase from the filesystem
  echo "Removing unwanted packages from filesystem..."
  rm -rf $(jq -r '.[]' /tmp/unwanted.json)
  rm -rf packages/.new-package

  mv package.json.new package.json
  rm package.json.working
  echo "Package removal completed."
}

build_server() {
  echo "Starting server build for package: $package"
  
  # clear out the tests and files not useful for production
  echo "Cleaning test files and development configs..."
  rm -rf packages/*/__tests__ || true
  rm -rf packages/*/jest.* || true
  rm -rf packages/*/docker || true
  rm -rf packages/*/coverage || true
  rm -rf packages/*/config/{local,development,test}.* || true

  remove_irrelevant_packages "$package"

  # build the world
  echo "Running npm build..."
  npm run build

  # clear out the build-tooling
  echo "Cleaning build tooling..."
  rm -rf node_modules/@tamanu/build-tooling
  rm -rf packages/build-tooling
  rm -rf packages/**/node_modules/@tamanu/build-tooling

  # clear out the build configs
  echo "Cleaning build configs..."
  rm -rf packages/*/*.config.* || true

  # remove build-tooling from top package.json
  echo "Removing build-tooling from package.json..."
  cp package.json{,.working}
  
  # Validate package.json before final processing
  if ! jq empty package.json.working 2>/dev/null; then
    echo "ERROR: package.json.working is not valid JSON in build_server"
    cat package.json.working
    exit 5
  fi
  
  jq '.dependencies |= del(."@tamanu/build-tooling") | .workspaces.packages -= ["packages/build-tooling"]' \
    package.json.working > package.json
  rm package.json.working

  # remove build dependencies
  echo "Reinstalling production dependencies..."
  npm install --no-interactive --package-lock

  # cleanup
  echo "Final cleanup..."
  npm cache clean --force
  rm -rf packages/.npm || true
  rm $0
  echo "Server build completed successfully."
}

build_web() {
  echo "Starting web build..."
  echo "Building shared packages..."
  npm run build-shared
  echo "Building web frontend..."
  npm run build --workspace @tamanu/web-frontend
  echo "Precompressing assets..."
  scripts/precompress-assets.sh packages/web/dist
  echo "Web build completed successfully."
}

package="${1:?Expected target or package path}"
echo "Docker build script started with package: $package"

echo "Running common setup..."
common

echo "Determining build type for package: $package"
case "$package" in
  web)
    echo "Building as web package"
    build_web
    ;;
  *)
    echo "Building as server package"
    build_server
    ;;
esac

echo "Docker build script completed successfully for package: $package"
