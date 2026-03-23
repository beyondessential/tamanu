#!/usr/bin/env bash

## Test that the facility server starts without any central server running

# Use `set -m` to enable Bash job-control to handle process trees easily.
# (Commands will have different process group ids from the process for this shell script itself.)
set -euxmo pipefail

# Create tamanu database and user for testing the facility server working offline
test_facility_offline_setup_postgres() {
    createuser --superuser tamanu
    psql -c "ALTER USER tamanu PASSWORD 'tamanu';" postgres

    createdb -O tamanu central
    createdb -O tamanu facility
}

# Build both the facility and central servers.
test_facility_offline_build() {
    npm install
    npm run build-shared
    npm run build --workspace @tamanu/central-server
    npm run build --workspace @tamanu/facility-server
}

# Start the central server.
test_facility_offline_central_start() {
    cat <<- EOF > packages/central-server/config/local.json5
    {
        "port": "3000",
        "db": {
            "host": "localhost",
            "name": "central",
            "verbose": true,
            "username": "tamanu",
            "password": "tamanu"
        },
        schedules: {
            sendStatusToMetaServer: {
                enabled: false,
            },
        },
    }
EOF

    cat <<- EOF > packages/central-server/provisioning.json5
    {
        users: {
            "admin@tamanu.io": {
                role: "admin",
                password: "admin",
                displayName: "Initial Admin",
                deviceRegistrationPermission: "unlimited",
            },
        },

        facilities: {
            "facility-test": {
                name: "Facility Test",
                code: "test",
                user: "facility-test@tamanu.io",
                password: "facility-test",
            },
        },

        settings: {
            global: {
                features: {
                    deviceRegistration: {
                        enabled: false,
                    },
                },
            },
        },
    }
EOF

    # specify ports for consistency
    npm run --workspace @tamanu/central-server start upgrade
    npm run --workspace @tamanu/central-server start provision provisioning.json5
    nohup npm run --workspace @tamanu/central-server start > central-server.out &
    echo "CENTRAL_SERVER_PID=$!" >> $GITHUB_ENV
    curl --retry 8 --retry-all-errors localhost:3000
}

# Start the facility server, to initialise it.
test_facility_offline_facility_start() {

	cat <<- EOF > packages/facility-server/config/local.json5
	{
	    "port": "4000",
	    "serverFacilityIds": ["facility-test"],
	    "sync": {
	        "email": "facility-test@tamanu.io",
	        "password": "facility-test",
	        "enabled": true,
	        "host": "http://localhost:3000"
	    },
	    "db": {
	        "host": "localhost",
	        "name": "facility",
	        "verbose": true,
	        "username": "tamanu",
	        "password": "tamanu",
	    },
        schedules: {
            sendStatusToMetaServer: {
                enabled: false,
            },
        },
	}
	EOF
	npm run --workspace @tamanu/facility-server start upgrade
	nohup npm run --workspace @tamanu/facility-server start > facility-server.out &
	echo "FACILITY_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-all-errors localhost:4000
}

test_facility_offline_stop_and_print() {
	kill -INT -$CENTRAL_SERVER_PID
	kill -INT -$FACILITY_SERVER_PID
	cat central-server.out
	cat facility-server.out
}

test_facility_offline_facility_start_again() {
	npm run --workspace @tamanu/facility-server start &
	curl --retry 8 --retry-all-errors localhost:4000
	kill -INT -$!
}

test_facility_offline_$( echo $1 | sed "s/-/_/g" )
