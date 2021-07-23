#!/bin/bash

>&2 echo "To pipe to a file    : $0 $@ | dump.sql"
>&2 echo "To pipe to a local db: DB=\"$1-$2-dump\"; FILE=\"\$(mktemp -t \"\$DB\")\"; dropdb \"\$DB\"; createdb \"\$DB\"; $0 $@ > \"\$FILE\"; psql \"\$DB\" < \"\$FILE\""
>&2 echo

source "$(dirname "${BASH_SOURCE[0]}")/common/common.bash"

connect_postgres
pg_dump "$PG_CONNECTION_URL"

