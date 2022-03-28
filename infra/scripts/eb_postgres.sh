#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

connect_postgres
echo "DB name: $PG_NAME"
psql "$PG_CONNECTION_URL"
