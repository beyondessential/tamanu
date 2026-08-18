#!/usr/bin/env bash

## Install postgresql server
## Postgres is already installed on the ubuntu-latest image, but it may not be
## the version we want, so we remove it and install from the official upstream.

set -euxo pipefail

pgversion="${1:?version must be provided}"

# The runner image leaves apt's acquire timeouts unset, and its retry setting
# uses a key apt doesn't read (apt reads Acquire::Retries, not
# APT::Acquire::Retries). A mirror that accepts the connection and then stalls
# mid-transfer therefore blocks with no deadline instead of failing over to the
# next mirror in the list.
sudo tee /etc/apt/apt.conf.d/99-ci-acquire >/dev/null <<'CONF'
Acquire::Retries "3";
Acquire::http::Timeout "15";
Acquire::https::Timeout "15";
CONF

# apt only fails over once the stalled mirror has timed out, so bound each
# attempt as well and retry the command as a whole.
apt_get() {
	local attempt
	for attempt in 1 2 3; do
		if sudo timeout 300 apt-get "$@"; then
			return 0
		fi
		echo "apt-get $* failed, attempt $attempt of 3" >&2
		sleep $((attempt * 10))
	done
	return 1
}

# configure official upstream apt repo
# from https://wiki.postgresql.org/wiki/Apt
apt_get install -y curl ca-certificates gnupg
curl --fail --silent --show-error --location --max-time 60 --retry 3 \
	https://www.postgresql.org/media/keys/ACCC4CF8.asc |
	gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# remove existing postgresql and install desired version
apt_get update
apt_get remove -y postgresql\*
apt_get install -y "postgresql-$pgversion"

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
