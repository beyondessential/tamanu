#!/bin/bash
HOST=$1
DB_ADMIN_USERNAME=$2
DB_ADMIN_PASSWORD=$3
PORT="5984"
DB_ADDRESS="http://$HOST:$PORT"
DB_NODENAME="nonode@nohost"

echo "$HOST"
echo "$DB_ADMIN_USERNAME"
echo "$DB_ADMIN_PASSWORD"

printf "\n=====================================================\n"
echo Performing Single Node Setup:
printf "=====================================================\n"

DB_CHECK_STR_OK='"ok":true'
DB_CHECK_STR_EXISTS='"error":"file_exists"'

RESULT=$(curl -s -X PUT $DB_ADDRESS/_users)
if [[ "$RESULT" == *$DB_CHECK_STR_OK* || "$RESULT" == *$DB_CHECK_STR_EXISTS* ]]; then
    SUCCESS=1
    echo 'Created _users database.'
else
    SUCCESS=0
    echo 'Failed to create _users database.'
fi

RESULT=$(curl -s -X PUT $DB_ADDRESS/_replicator)
if [[ "$RESULT" == *$DB_CHECK_STR_OK* || "$RESULT" == *$DB_CHECK_STR_EXISTS* ]]; then
    SUCCESS=1
    echo Created _replicator database.
else
    SUCCESS=0
    echo Failed to create _replicator database.
fi

RESULT=$(curl -s -X PUT $DB_ADDRESS/_global_changes)
if [[ "$RESULT" == *$DB_CHECK_STR_OK* || "$RESULT" == *$DB_CHECK_STR_EXISTS* ]]; then
    SUCCESS=1
    echo Created _global_changes database.
else
    SUCCESS=0
    echo Failed to create _global_changes database.
fi

if [ $SUCCESS == 0 ]; then
    echo -ne "Single node setup failed. You'll need to do it manually.\n\n"
    exit
fi

printf "\n=====================================================\n"
echo Creating Database Admin User:
printf "=====================================================\n"

# CouchDB password needs to be wrapped in double quotes.
DB_ADMIN_PASSWORD=\""$DB_ADMIN_PASSWORD"\"

RESULT=$(curl -s -X PUT $DB_ADDRESS/_node/$DB_NODENAME/_config/admins/$DB_ADMIN_USERNAME -d $DB_ADMIN_PASSWORD)

if [[ $RESULT == "\"\"" ]]; then
    echo -ne "\nAdmin user \"$DB_ADMIN_USERNAME\" successfully created.\n"
    SECURE=1
else
    echo -ne "\nError creating admin user \"$DB_ADMIN_USERNAME\".\n"
    if [[ $RESULT == *'"error":"unauthorized'* ]]; then
        echo -ne "\nIt appears an admin user already exists.\n"
        SECURE=1
    else
        SECURE=0
    fi

    echo -ne "\nServer response: $RESULT.\n"
fi

if [[ $SECURE == 1 ]]; then
    echo -ne "\nThe CouchDB \"Admin Party\" has been neutralized.\n"
    echo -ne "\nYour CouchDB installation is now secure.\n"
else
    echo -ne "\nThe CouchDB \"Admin Party\" may be still ongoing.\n"
    echo -ne "\nYour CouchDB installation is NOT SECURE, unless there is at least one admin.\n"
    echo -ne "\nMAKE SURE THERE IS AN ADMIN USER OR CREATE AN ADMIN USER MANUALLY.\n"
fi