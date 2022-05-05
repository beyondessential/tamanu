#!/bin/bash
set -euo pipefail

for n in tamanu-lan tamanu-sync; do
    psql "$n" -c '' || exit 1
done
exit 0
