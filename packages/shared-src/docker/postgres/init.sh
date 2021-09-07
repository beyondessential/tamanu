#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 <<-EOF
     CREATE ROLE "tamanu-lan" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-lan';
     CREATE DATABASE "tamanu-lan" WITH OWNER "tamanu-lan";
     CREATE ROLE "tamanu-sync" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-sync';
     CREATE DATABASE "tamanu-sync" WITH OWNER "tamanu-sync";
EOF
