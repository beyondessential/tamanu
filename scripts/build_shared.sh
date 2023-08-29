#!/bin/bash
set -euxo pipefail

yarn install --non-interactive --frozen-lockfile
yarn workspace @tamanu/shared run build
pwd
ls -la
yarn workspace @tamanu/constants run build
