#!/usr/bin/env bash

set -euxo pipefail

git pull
yarn
pm2 reload sync.pm2.config.js
