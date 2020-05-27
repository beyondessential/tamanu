#!/bin/bash
set -euxo pipefail
echo "Installing now"

# load nvm
node -v
yarn -v

yarn config set workspaces-experimental true
yarn config set workspaces-nohoist-experimental true
yarn install --non-interactive

