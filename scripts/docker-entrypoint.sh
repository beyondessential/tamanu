#!/bin/bash

### This expects to be run in the production docker container in /Dockerfile.
# While not strictly required, it is prefered to run with an init process.

if [[ -d /config ]]; then
  # copy the config file(s) from the configurator into the expected place
  cp -v /config/*.json ./config/
fi

if [[ -d /meta ]]; then
  # expose the build metadata as environment variables
  # these are then pulled by Tamanu into the OpenTelemetry context
  for f in /meta/*; do
    export "OTEL_CONTEXT_$(basename $f)"="$(cat $f)"
  done
fi

if [[ "$1" == "healthcheck" ]]; then
  # used as healthcheck command in ECS
  set -eo pipefail

  # rest of the arguments are those used to start the container
  # that can be used to determine what kind of healthcheck to run
  shift

  case "$1" in
    serve)
      curl http://localhost:3000 | jq '.index == true' | grep -F true
      ;;
    # TODO: healthcheck for task runner (check process is running?)
    *)
      echo "Unknown healthcheck type: $1"
      exit 0 # assume success
      ;;
  esac
elif which "$1" >/dev/null; then
  # if the first arg is a binary, run it
  # that provides a convenient way to run arbitrary commands in the container
  exec $*
else
  # otherwise, run the app
  exec node dist/app.bundle.js $*
fi
