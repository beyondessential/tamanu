#!/usr/bin/env bash

set -euxo pipefail

pgversion="${1:?version must be provided}"
package="${2:?package must be provided}"

# from https://wiki.postgresql.org/wiki/Apt
sudo apt install -y curl ca-certificates gnupg
curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt remove -y postgresql\*
sudo apt install -y "postgresql-$pgversion"

echo "/usr/lib/postgresql/$pgversion/bin" >> $GITHUB_PATH
export PATH="$PATH:/usr/lib/postgresql/$pgversion/bin"

export PGDATA="$RUNNER_TEMP/pgdata"
pg_ctl init --options="--encoding=UTF-8 --locale=en_US.UTF-8"

echo "unix_socket_directories = ''" >> "$PGDATA/postgresql.conf"
echo "port = 5432" >> "$PGDATA/postgresql.conf"

pg_ctl start

export PGHOST=127.0.0.1
echo "PGHOST=$PGHOST" >> $GITHUB_ENV
export PGUSER="${USER:-$USERNAME}"
echo "PGUSER=$PGUSER" >> $GITHUB_ENV
export PGPORT=5432
echo "PGPORT=$PGPORT" >> $GITHUB_ENV

.github/scripts/wait-for-it.sh localhost:5432

name=$(sed 's/-server$//' <<< "tamanu-$package")
echo "NODE_CONFIG=$(jq -Rc '{db:{host:"127.0.0.1",name:.,username:.,password:.}}' <<< $name)" >> $GITHUB_ENV

createuser --superuser "$name"
createdb -O "$name" "$name"
psql -c "ALTER USER \"$name\" PASSWORD '$name';" $name