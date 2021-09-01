#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

prwarn "CONNECTING TO $ENVIRONMENT VIA SSH"

eb ssh --quiet --custom "ssh -i $KEYPAIR" "$ENVIRONMENT"
