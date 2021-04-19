#!/bin/bash
set -euxo pipefail

# babel doesn't remove old files, and this can cause bugs - particularly when something is reverted!
echo "Removing old shared package"
rm -rf packages/shared/[!package.json][!.gitignore]*

echo "Building shared package"
yarn run build-shared
