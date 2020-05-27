#!/bin/bash
set -euxo pipefail
echo "Installing now"

# load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
which node
nvm use 12.16.3
node -v

yarn config set workspaces-experimental true
yarn config set workspaces-nohoist-experimental true
yarn install --non-interactive

