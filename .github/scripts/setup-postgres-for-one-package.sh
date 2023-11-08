#!/usr/bin/env bash

## Configure Postgre and a Tamanu server package for CI.

package="${1:?package must be provided}"

# configure tamanu (tests) to use this database
name=$(sed 's/-server$//' <<< "tamanu-$package")
echo "NODE_CONFIG=$(jq -Rc '{db:{host:"127.0.0.1",name:.,username:.,password:.}}' <<< $name)" >> $GITHUB_ENV

# create tamanu database and user for the package being tested
createuser --superuser "$name"
createdb -O "$name" "$name"
psql -c "ALTER USER \"$name\" PASSWORD '$name';" $name
