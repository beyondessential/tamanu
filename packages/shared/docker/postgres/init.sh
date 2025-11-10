#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 <<-EOF
    CREATE ROLE "tamanu-facility" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-facility';
    CREATE DATABASE "tamanu-facility" WITH OWNER "tamanu-facility";
    CREATE ROLE "tamanu-central" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-central';
    CREATE DATABASE "tamanu-central" WITH OWNER "tamanu-central";
    CREATE ROLE "tamanu_reporting_user" WITH LOGIN PASSWORD 'test';
    CREATE ROLE "tamanu_raw_user" WITH LOGIN PASSWORD 'test';
    \c app
    CREATE SCHEMA IF NOT EXISTS reporting;
    ALTER ROLE "tamanu_reporting_user" SET search_path TO reporting;
    GRANT USAGE ON SCHEMA reporting TO "tamanu_reporting_user";
    GRANT USAGE ON SCHEMA public TO "tamanu_raw_user";
    GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO "tamanu_reporting_user";
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO "tamanu_raw_user";
EOF
