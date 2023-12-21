#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 <<-EOF
    CREATE ROLE "tamanu-facility" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-facility';
    CREATE DATABASE "tamanu-facility" WITH OWNER "tamanu-facility";
    CREATE ROLE "tamanu-centralp" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-central';
    CREATE DATABASE "tamanu-central" WITH OWNER "tamanu-central";
EOF
