#!/usr/bin/env bash

## Test that the facility server starts without any central server running

# Use `set -m` to enable Bash job-control to handle process trees easily.
# (Commands will have different process group ids from the process for this shell script itself.)
set -euxmo pipefail

# Create tamanu database and user for testing the facility server working offline
test_facility_offline_setup_postgre() {
	createuser --superuser "admin"
	createdb -O "admin" "central-server"
	psql -c "ALTER USER \"admin\" PASSWORD 'central-server';" central-server

	createdb -O "admin" "facility-server"
	psql -c "ALTER USER \"admin\" PASSWORD 'facility-server';" facility-server
}

# Build both the facility and central servers.
test_facility_offline_build() {
	yarn
	yarn build-shared
	yarn workspace @tamanu/central-server build
	yarn workspace @tamanu/facility-server build
}

# Start the central server.
test_facility_offline_central_start() {
	cat <<- EOF > packages/central-server/config/local.json
	{
	    "port": "3000",
	    "db": {
	        "host": "localhost",
	        "name": "central-server",
	        "verbose": true,
	        "username": "admin",
	        "password": "central-server"
	    }
	}
	EOF

	cat <<- EOF > packages/central-server/provisioning.kdl
	provisioning {
	  users {
	    "admin@tamanu.io" {
	        role "admin"
	        password "admin"
	        displayName "Initial Admin"
	    }
	  }

	  facilities {
	    facility-test {
	        name "Facility Test"
	        code "test"
	        user "facility-test@tamanu.io"
	        password "facility-test"
	    }
	  }
	}
	EOF
	# specify ports for consistency
	yarn workspace @tamanu/central-server start migrate
	nohup yarn workspace @tamanu/central-server start --provisioning provisioning.kdl > central-server.out &
	echo "CENTRAL_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-connrefused localhost:3000
}

# Start the facility server, to initialise it.
test_facility_offline_facility_start() {

	cat <<- EOF > packages/facility-server/config/local.json
	{
	    "port": "4000",
	    "serverFacilityId": "facility-test",
	    "sync": {
	        "email": "facility-test@tamanu.io",
	        "password": "facility-test",
	        "enabled": true,
	        "host": "http://localhost:3000"
	    },
	    "db": {
	        "host": "localhost",
	        "name": "facility-server",
	        "verbose": true,
	        "username": "admin",
	        "password": "facility-server",
	        "migrateOnStartup": true
	    }
	}
	EOF
	nohup yarn workspace @tamanu/facility-server start > facility-server.out &
	echo "FACILITY_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-connrefused localhost:4000
}

test_facility_offline_stop_and_print() {
	kill -INT -$CENTRAL_SERVER_PID
	kill -INT -$FACILITY_SERVER_PID
	cat central-server.out
	cat facility-server.out
}

test_facility_offline_facility_start_again() {
	yarn workspace @tamanu/facility-server start &
	curl --retry 8 --retry-connrefused localhost:4000
	kill -INT -$!
}

test_facility_offline_$( echo $1 | sed "s/-/_/g" )
