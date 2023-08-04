#!/bin/sh
yarn -s workspace @tamanu/api-client run -s build:src -q
exec yarn -s workspace @tamanu/api-client run -s start $*
