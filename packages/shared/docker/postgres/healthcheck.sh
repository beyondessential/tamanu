#!/bin/bash
set -euxo pipefail

for db in tamanu-lan tamanu-sync; do
    psql "$db" -U postgres -c 'SELECT 1;'
done
