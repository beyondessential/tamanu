#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

PORT="${PORT:-5433}"

# retrieve details from AWS
ENDPOINT="$(aws rds describe-db-instances | jq -r '.DBInstances[] | select((.TagList[] | select(.Key == "elasticbeanstalk:environment-name")).Value == "'"$ENVIRONMENT"'") | .Endpoint.Address')"
prlog "db endpoint: $ENDPOINT"
NODE_CONFIG="$(eb printenv "$ENVIRONMENT" | grep NODE_CONFIG | sed -e 's/.*NODE_CONFIG = //')"
NAME="$(echo "$NODE_CONFIG" | jq -r '.db.name')"
prlog "name: $NAME"
USERNAME="$(echo "$NODE_CONFIG" | jq -r '.db.username')"
prlog "username: $USERNAME"
PASSWORD="$(echo "$NODE_CONFIG" | jq -r '.db.password')"
prlog "password: <found password in environment NODE_CONFIG>"

# connect ssh
eb ssh --quiet --custom "ssh -i $KEYPAIR" --command ':' "$ENVIRONMENT"
eb ssh --quiet --custom "ssh -i $KEYPAIR -N -L $PORT:$ENDPOINT:5432" "$ENVIRONMENT" &
prlog "waiting for eb ssh to connect"
sleep 5 # let ssh connect
prlog "attempting psql connection"

# echo warning
prwarn "CONNECTING TO $ENVIRONMENT"

# showtime
psql "postgresql://$USERNAME:$PASSWORD@localhost:$PORT/$NAME"
