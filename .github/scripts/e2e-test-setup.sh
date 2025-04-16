#!/usr/bin/env bash

# Use `set -m` to enable Bash job-control to handle process trees easily.
# (Commands will have different process group ids from the process for this shell script itself.)
set -euxmo pipefail

# Create tamanu database and user for e2e tests.
e2e_test_setup_setup_postgres() {
    createuser --superuser tamanu
    psql -c "ALTER USER tamanu PASSWORD 'tamanu';" postgres

    createdb -O tamanu central
    createdb -O tamanu facility
}

e2e_test_setup_setup_central() {
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

    npm run --workspace @tamanu/central-server start migrate
    npm run --workspace @tamanu/central-server start provision provisioning.json5
}

e2e_test_setup_setup_facility() {

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

    # insert a test user into the facility database
    psql -d facility -c "INSERT INTO users (email, password, role) VALUES ('test1@tamanu.io', 'test1', 'admin');"

    npm run --workspace @tamanu/facility-server start migrate
}

e2e_test_setup_$( echo $1 | sed "s/-/_/g" )