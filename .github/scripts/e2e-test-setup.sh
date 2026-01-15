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
                "timeZone": "UTC",
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
                "previewUvciFormat": "tamanu",
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
                deviceRegistrationPermission: "unlimited",
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
                    deviceRegistration: {
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
                url: 'https://bes-tamanu-dev-referencedata.s3.ap-southeast-2.amazonaws.com/referencedata/default.xlsx',
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