#!/bin/bash

set -euo pipefail

echo "Clean runtime dir"
rm -rf /tamanu/* || true

echo "Copy files to runtime dir"
cp -r --reflink=auto /pre/* /pre/.*{rc,ignore} /tamanu/

echo "Reinstate SSH Private key"
echo -e $PRIVATE_SSH_KEY >> /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa
