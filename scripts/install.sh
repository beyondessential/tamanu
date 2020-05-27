#!/bin/bash
set -euxo pipefail
echo "Installing now"

node -v

yarn config set workspaces-experimental true
yarn config set workspaces-nohoist-experimental true
yarn install --non-interactive

