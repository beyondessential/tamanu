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
        "countryTimeZone": "Pacific/Auckland",
        "auth": {
            "tokenDuration": "24h"
        },
        "db": {
            "host": "localhost",
            "name": "central",
            "verbose": true,
            "username": "tamanu",
            "password": "tamanu"
        },
        "schedules": {
            "sendStatusToMetaServer": {
                "enabled": false
            }
        },
        "localisation": {
            "data": {
                "country": {
                    "name": "Utopia",
                    "alpha-2": "UT",
                    "alpha-3": "UTO"
                },
                "timeZone": "Pacific/Auckland",
                "imagingTypes": {
                    "orthopantomography": { "label": "Orthopantomography" },
                    "xRay": { "label": "X-Ray" },
                    "ctScan": { "label": "CT Scan" },
                    "ultrasound": { "label": "Ultrasound" },
                    "mri": { "label": "MRI" },
                    "ecg": { "label": "Electrocardiogram (ECG)" },
                    "holterMonitor": { "label": "Holter Monitor" },
                    "echocardiogram": { "label": "Echocardiogram" },
                    "mammogram": { "label": "Mammogram" },
                    "mammogramScreen": { "label": "Mammogram Screening" },
                    "mammogramDiag": { "label": "Mammogram Diagnostic" },
                    "endoscopy": { "label": "Endoscopy" },
                    "fluroscopy": { "label": "Fluroscopy" },
                    "angiogram": { "label": "Angiogram" },
                    "colonoscopy": { "label": "Colonoscopy" },
                    "vascularStudy": { "label": "Vascular Study" },
                    "stressTest": { "label": "Treadmill" }
                },

                "disabledReports": [
                    "aefi",
                    "india-assistive-technology-device-line-list",
                    "iraq-assistive-technology-device-line-list"
                ],
                "supportDeskUrl": "https://bes-support.zendesk.com/hc/en-us"
            }
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
                    desktopCharting: {
                        enabled: true,
                    },
                    enableTasking: true,
                },
            },
        },

        referenceData: [
            {
                defaultSpreadsheet: true,
            },
        ],

        programs: [
            {
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/programs/vitals.xlsx',
            },
            {
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/programs/neurological-assessment.xlsx',
            },
            {
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/programs/ncd-primary-screening.xlsx',
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
	    "countryTimeZone": "Pacific/Auckland",
	    "auth": {
	        "tokenDuration": "24h"
	    },
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

e2e_test_setup_start_servers_no_sync() {
    nohup npm run --workspace @tamanu/central-server start > central-server.out &
    # Wait for central to accept connections before kicking off facility.
    curl --retry 20 --retry-all-errors --retry-delay 2 localhost:3000

    nohup npm run --workspace @tamanu/facility-server start > facility-server.out &
    curl --retry 20 --retry-all-errors --retry-delay 2 localhost:4000
}

e2e_test_setup_start_servers() {
    nohup npm run --workspace @tamanu/central-server start > central-server.out &
    # Wait for central to accept connections before kicking off sync.
    curl --retry 20 --retry-all-errors --retry-delay 2 localhost:3000

    # Run the initial sync BEFORE the facility-server is up. If the facility-server
    # is running in parallel, its scheduled SyncTask (`*/1 * * * *`) will open a new
    # session for the same device id, and central will close out our subcommand's
    # session with "Session marked as completed due to its device reconnecting".
    # Doing the slow first sync here in isolation avoids that race entirely.
    #
    # On a cold central server the SyncLookupRefresher (every 20s, no runImmediately)
    # may not have built the lookup table yet, in which case sync fails with
    # "Sync lookup table has not yet built. Cannot initiate sync." — retry a few
    # times to give it room to finish the first build.
    local attempt=0
    local max_attempts=8
    until npm run --workspace @tamanu/facility-server start sync; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge "$max_attempts" ]; then
            echo "facility-server sync failed after $attempt attempts" >&2
            return 1
        fi
        echo "facility-server sync attempt $attempt failed; retrying in 15s" >&2
        sleep 15
    done

    nohup npm run --workspace @tamanu/facility-server start > facility-server.out &
    curl --retry 20 --retry-all-errors --retry-delay 2 localhost:4000
}

e2e_test_setup_$( echo $1 | sed "s/-/_/g" )