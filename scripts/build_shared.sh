#!/bin/bash
set -euxo pipefail

yarn install --non-interactive --frozen-lockfile
yarn workspace shared-src run build
yarn install --non-interactive --frozen-lockfile
