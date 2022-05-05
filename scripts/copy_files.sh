#!/bin/bash

set -euo pipefail

echo "Clean runtime dir"
rm -rf /tamanu/* || true

echo "Copy files to runtime dir"
cp -r --reflink=auto /pre/* /pre/.*{rc,ignore} /tamanu/
