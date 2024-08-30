#!/bin/bash

### This expects to be run in the production docker container in /Dockerfile.
# While not strictly required, it is prefered to run with an init process.

if which "$1" >/dev/null; then
  # if the first arg is a binary, run it
  # that provides a convenient way to run arbitrary commands in the container
  exec $*
else
  # otherwise, run the app
  exec node dist $*
fi
