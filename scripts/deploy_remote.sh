#!/usr/bin/env bash

set -euxo pipefail

cd ~/tamanu

BRANCH=$1
CURRENT_BRANCH=`git branch --show-current`

if [ $BRANCH == $CURRENT_BRANCH ]; then
  git pull
  yarn
  pm2 reload sync.pm2.config.js
else
  echo "Wrong branch for this deploy - expected $CURRENT_BRANCH, got $BRANCH."
fi

