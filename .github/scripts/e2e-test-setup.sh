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
            },
        },

        facilities: {
            "facility-1": {
                name: "facility-1",
                code: "facility-1",
                user: "facility-1@tamanu.io",
                password: "facility-1",
            },
        },

        settings: {
            global: {
                features: {
                    deviceRegistrationQuota: {
                        enabled: false,
                    },
                },
            },
        },

        referenceData: [
            {
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/referencedata/default.xlsx',
            },
        ],

        programs: [
            {
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/programs/vitals.xlsx',
            },
        ],
    }
EOF

    npm run --workspace @tamanu/central-server start upgrade
    npm run --workspace @tamanu/central-server start provision provisioning.json5
}

e2e_test_setup_setup_facility() {

	cat <<- EOF > packages/facility-server/config/local.json5
	{
	    "port": "4000",
	    "serverFacilityIds": ["facility-1"],
	    "sync": {
	        "email": "facility-1@tamanu.io",
	        "password": "facility-1",
	        "enabled": true,
	        "host": "http://localhost:3000"
	    },
	    "db": {
	        "host": "localhost",
	        "name": "facility",
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

    npm run --workspace @tamanu/facility-server start upgrade
}

e2e_test_setup_start_servers() {
    nohup npm run --workspace @tamanu/central-server start > central-server.out &
    nohup npm run --workspace @tamanu/facility-server start > facility-server.out &
    # Give servers time to start before syncing
    sleep 20
    # Sync the servers
    npm run --workspace @tamanu/facility-server start sync
    sleep 20
}

e2e_test_setup_$( echo $1 | sed "s/-/_/g" )
