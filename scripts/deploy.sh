#!/usr/bin/env bash

BRANCH=$1

ssh ${url} ${dir}/deploy_remote.sh ${type} ${CI_BRANCH} ${filename}
