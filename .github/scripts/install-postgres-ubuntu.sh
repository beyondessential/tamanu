#!/usr/bin/env bash

## Install postgresql server
## Postgres is already installed on the ubuntu-latest image, but it may not be
## the version we want, so we remove it and install from the official upstream.

set -euxo pipefail

pgversion="${1:?version must be provided}"

# configure official upstream apt repo
# from https://wiki.postgresql.org/wiki/Apt
sudo apt install -y curl ca-certificates gnupg
curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# remove existing postgresql and install desired version
sudo apt update
sudo apt remove -y postgresql\*
sudo apt install -y "postgresql-$pgversion"

# add postgresql binaries to path
echo "/usr/lib/postgresql/$pgversion/bin" >> $GITHUB_PATH
export PATH="$PATH:/usr/lib/postgresql/$pgversion/bin"

# create a new database cluster with our locale settings
# locale is set so that sort is defined so the sort-dependent tests pass
export PGDATA="$RUNNER_TEMP/pgdata"
pg_ctl init --options="--encoding=UTF-8 --locale=en_US.UTF-8 --lc-collate=C --lc-ctype=C"

# configure postgresql to listen on all interfaces and not the socket
echo "unix_socket_directories = ''" >> "$PGDATA/postgresql.conf"
echo "port = 5432" >> "$PGDATA/postgresql.conf"

# start postgresql
pg_ctl start

# configure environment variables for psql here and in subsequent scripts
export PGHOST=127.0.0.1
echo "PGHOST=$PGHOST" >> $GITHUB_ENV
export PGUSER="${USER:-$USERNAME}"
echo "PGUSER=$PGUSER" >> $GITHUB_ENV
export PGPORT=5432
echo "PGPORT=$PGPORT" >> $GITHUB_ENV

# wait for postgresql to be ready to accept connections
.github/scripts/wait-for-it.sh localhost:5432
