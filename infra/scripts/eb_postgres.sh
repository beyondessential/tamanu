#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

connect_postgres
psql "$PG_CONNECTION_URL"
