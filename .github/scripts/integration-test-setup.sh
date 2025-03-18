#!/usr/bin/env bash

# Use `set -m` to enable Bash job-control to handle process trees easily.
# (Commands will have different process group ids from the process for this shell script itself.)
set -euxmo pipefail

# Create tamanu database and user for testing the facility server working offline
integration_test_setup_postgres() {
    createuser --superuser tamanu
    psql -c "ALTER USER tamanu PASSWORD 'tamanu';" postgres

    createdb -O tamanu central
    createdb -O tamanu facility
}

# Build both the facility and central servers.
integration_test_setup_build() {
    npm install
    npm run build-shared
    npm run build --workspace @tamanu/central-server
    npm run build --workspace @tamanu/facility-server
}

# Start the central server.
integration_test_setup_central_start() {
    cat <<- EOF > packages/central-server/config/local.json5
    {
        "port": "3000",
        "db": {
            "host": "localhost",
            "name": "central",
            "verbose": true,
            "username": "tamanu",
            "password": "tamanu"
        }
    }
EOF

    cat <<- EOF > packages/central-server/provisioning.json5
    {
        users: {
            "admin@tamanu.io": {
                role: "admin",
                password: "admin",
                displayName: "Initial Admin",
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
    }
EOF

    # specify ports for consistency
    npm run --workspace @tamanu/central-server start migrate
    npm run --workspace @tamanu/central-server start provision provisioning.json5
    nohup npm run --workspace @tamanu/central-server start > central-server.out &
    echo "CENTRAL_SERVER_PID=$!" >> $GITHUB_ENV
    curl --retry 8 --retry-all-errors localhost:3000
}

# Start the facility server, to initialise it.
integration_test_setup_facility_start() {

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
	        "migrateOnStartup": true
	    }
	}
	EOF
	nohup npm run --workspace @tamanu/facility-server start > facility-server.out &
	echo "FACILITY_SERVER_PID=$!" >> $GITHUB_ENV
	curl --retry 8 --retry-all-errors localhost:4000
}

integration_test_setup_$( echo $1 | sed "s/-/_/g" )