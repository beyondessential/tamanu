#!/bin/bash
echo "Running tests"
yarn --version
node --version
yarn workspaces info
yarn test
