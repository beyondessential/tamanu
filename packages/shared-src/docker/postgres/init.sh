#!/bin/bash
set -euo pipefail

for app in lan sync; do
psql -v ON_ERROR_STOP=1 <<EOF
     CREATE ROLE "tamanu-$app" WITH LOGIN ENCRYPTED PASSWORD 'tamanu-$app';
     CREATE DATABASE "tamanu-$app" WITH OWNER "tamanu-$app";
EOF
done

for v in 12 14; do
psql -v ON_ERROR_STOP=1 <<EOF
     CREATE DATABASE "tamanu-$v" WITH OWNER "postgres";
EOF
done
