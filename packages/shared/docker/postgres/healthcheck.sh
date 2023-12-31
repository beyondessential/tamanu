#!/bin/bash
set -euxo pipefail

for db in tamanu-facility tamanu-central; do
    psql "$db" -U postgres -c 'SELECT 1;'
done
