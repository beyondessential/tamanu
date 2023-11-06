#!/usr/bin/env bash

# create tamanu database and user for the package being tested
createuser --superuser "admin"
createdb -O "admin" "sync-server"
psql -c "ALTER USER \"admin\" PASSWORD 'sync-server';" sync-server

createdb -O "admin" "lan"
psql -c "ALTER USER \"admin\" PASSWORD 'lan';" lan

# Build both the facility Testnd central servers.
yarn
yarn build-shared
yarn workspace sync-server build
yarn workspace lan build

# Start the central server.
cat << EOF > packages/sync-server/config/local.json
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

cat << EOF > packages/sync-server/provisioning.kdl
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
yarn workspace sync-server start --provisioning provisioning.kdl > ./sync.log &
sync_pid=$!
curl --retry 8 --retry-connrefused localhost:3000

# Start the facility server, to initialise it.
cat << EOF > packages/lan/config/local.json
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
yarn workspace lan start > ./lan1.log &
lan_pid=$!
curl --retry 8 --retry-connrefused localhost:4000

# Stop the servers.
kill -2 -$lan_pid
kill -2 -$sync_pid
wait $sync_pid
wait $lan_pid

# Start the facility server again.
yarn workspace lan start > ./lan2.log &
curl --retry 8 --retry-connrefused localhost:4000
kill -2 -$!
