#!/bin/bash
set -euxo pipefail

echo "Building LAN Server"

yarn --cwd ${LAN_ROOT} run package

./scripts/pack.sh lan
