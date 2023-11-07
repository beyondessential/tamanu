#!/usr/bin/env bash

## Test that the facility server starts without any central server running

# Enable Bash job-control to handle process trees easily.
# (Commands will have different process group ids from the process for this shell script itself.)
set -m

# Create tamanu database and user for testing the facility server working offline
test_facility_offline_setup_postgre() {
	createuser --superuser "admin"
	createdb -O "admin" "sync-server"
	psql -c "ALTER USER \"admin\" PASSWORD 'sync-server';" sync-server

	createdb -O "admin" "lan"
	psql -c "ALTER USER \"admin\" PASSWORD 'lan';" lan
}

# Build both the facility Testnd central servers.
test_facility_offline_build() {
	yarn
	yarn build-shared
	yarn workspace sync-server build
	yarn workspace lan build
}

# Start the central server.
test_facility_offline_central_start() {
	cat <<- EOF > packages/sync-server/config/local.json
	{
	    "port": "3000",
	    "db": {
	        "host": "localhost",
	        "name": "sync-server",
	        "verbose": true,
	        "username": "admin",
	        "password": "sync-server"
	    }
	}
	EOF

	cat <<- EOF > packages/sync-server/provisioning.kdl
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
	yarn workspace sync-server start migrate # provisioning happens before migration at `serveAll.js` `serveAll` function. Is there any reason?
	nohup yarn workspace sync-server start --provisioning provisioning.kdl > central-server.out &
	echo "CENTRAL_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-connrefused localhost:3000
}

# Start the facility server, to initialise it.
test_facility_offline_facility_start() {

	cat <<- EOF > packages/lan/config/local.json
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
	        "name": "lan",
	        "verbose": true,
	        "username": "admin",
	        "password": "lan",
	        "migrateOnStartup": true
	    }
	}
	EOF
	nohup yarn workspace lan start > facility-server.out &
	echo "FACILITY_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-connrefused localhost:4000
}

test_facility_offline_stop_and_print() {
	kill -2 -$CENTRAL_SERVER_PID
	kill -2 -$FACILITY_SERVER_PID
	wait $CENTRAL_SERVER_PID
	wait $FACILITY_SERVER_PID
	cat central-server.out
	cat facility-server.out
}

test_facility_offline_facility_start_again() {
	yarn workspace lan start &
	curl --retry 8 --retry-connrefused localhost:4000
	kill -2 -$!
}

test_facility_offline_$( echo $1 | sed "s/-/_/g" )
