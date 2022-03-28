#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

connect_postgres
echo "DB URL : $PG_CONNECTION_URL"
echo "DB name: $PG_NAME"
wait
