#!/usr/bin/env bash

BRANCH=$1
USER=ubuntu
HOST=sync-dev.tamanu.io

ssh $USER@$HOST ~/tamanu/deploy_remote.sh ${CI_BRANCH}
