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

echo "PGHOST=localhost" >> $GITHUB_ENV
echo "PGUSER=${USER:-$USERNAME}" >> $GITHUB_ENV
echo "PGPORT=5432" >> $GITHUB_ENV

.github/scripts/wait-for-it.sh localhost:5432

dbname=$(sed '/-server/d' <<< "tamanu-$package")
echo "DBNAME=$dbname" >> $GITHUB_ENV
echo "NODE_CONFIG=$(jq -Rc '{db:{host:"127.0.0.1",name:.,username:.,password:.}}' <<< $dbname)" >> $GITHUB_ENV

createuser --createdb "$dbname"
createdb -O "$dbname" "$dbname"
psql -c "ALTER USER $dbname PASSWORD '$dbname';" $dbname