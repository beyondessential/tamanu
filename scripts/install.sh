#!/bin/bash
echo "Installing now"
nvm use 12.16.3
yarn config set workspaces-experimental true
yarn config set workspaces-nohoist-experimental true
yarn install --non-interactive