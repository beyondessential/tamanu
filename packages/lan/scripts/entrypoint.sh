#!/usr/bin/env bash
# It will generally take about 20 seconds for couchdb to be ready to receive connections
file="/run/secrets/tamanu_lan_config"
host=$(cat $file | jq '.localDB.host')
host=$(sed -e 's/^"//' -e 's/"$//' <<<"$host")
username=$(cat $file | jq '.localDB.username')
username=$(sed -e 's/^"//' -e 's/"$//' <<<"$username")
password=$(cat $file | jq '.localDB.password')
password=$(sed -e 's/^"//' -e 's/"$//' <<<"$password")
echo 'Scheduling setup scripts to run in 20 seconds...'
sleep 20 && /usr/src/app/scripts/initcouch.sh $host $username $password 2>&1
# echo 'Scheduling setup scripts to run in 50 seconds...'
# sleep 50 && /usr/src/app/scripts/initcouch.sh $host $username $password 2>&1
pm2-runtime start pm2.json --formatted --env $NODE_ENV