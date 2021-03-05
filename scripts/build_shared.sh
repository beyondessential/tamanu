#!/bin/bash
set -euxo pipefail

echo "Building shared package"
yarn run build-shared
