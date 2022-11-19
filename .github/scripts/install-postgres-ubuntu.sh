#!/usr/bin/env bash

set -euxo pipefail

pgversion="${1:?version must be provided}"

# from https://wiki.postgresql.org/wiki/Apt
sudo apt install -y curl ca-certificates gnupg
curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt remove -y postgresql\*
sudo apt install -y "postgresql-$pgversion"