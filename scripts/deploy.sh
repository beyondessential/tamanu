#!/usr/bin/env bash

BRANCH=$1

echo `pwd`
echo $BRANCH
yarn run pm2 deploy sync.pm2.config.js $BRANCH --no-daemon
