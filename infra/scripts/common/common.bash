# safety first!
set -euo pipefail
trap "kill 0" EXIT # kill background processes on exit

# common variables
# https://stackoverflow.com/questions/59895/how-can-i-get-the-source-directory-of-a-bash-script-from-within-the-script-itsel
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
KEYPAIR="~/.ssh/tamanu-eb-key-pair"

# common functions
function prlog {
    >&2 echo "[script] $1"
}

function prwarn {
    MESSAGE="## $1 ##"
    >&2 echo
    echo "$MESSAGE" | sed -e 's/./#/g' >&2
    >&2 echo "$MESSAGE"
    echo "$MESSAGE" | sed -e 's/./#/g' >&2
    >&2 echo
}

function prusage {
    >&2 echo "Usage: $0 <application name> <environment name>"
    >&2 echo "  e.g. '$0 tamanu-sync-server tamanu-sync-server-demo'"
    >&2 echo
    >&2 echo "  You will also need:"
    >&2 echo "    - jq installed"
    >&2 echo "    - the elasticbeanstalk cli installed and configured"
    >&2 echo "    - the tamanu-eb-key-pair saved in $HOME/.ssh/tamanu-eb-keypair"
    exit 1
}

function connect_postgres {
    PG_PORT="${PORT:-5433}"

    # retrieve details from AWS
    NODE_CONFIG="$(eb printenv "$ENVIRONMENT" | grep NODE_CONFIG | sed -e 's/.*NODE_CONFIG = //')"
    ENDPOINT="$(echo "$NODE_CONFIG" | jq -r '.db.host')"
    prlog "db endpoint: $ENDPOINT"
    PG_NAME="$(echo "$NODE_CONFIG" | jq -r '.db.name')"
    prlog "name: $PG_NAME"
    PG_USERNAME="$(echo "$NODE_CONFIG" | jq -r '.db.username')"
    prlog "username: $PG_USERNAME"
    PG_PASSWORD="$(echo "$NODE_CONFIG" | jq -r '.db.password')"
    prlog "password: <found password in environment NODE_CONFIG>"

    # connect ssh
    eb ssh --quiet --custom "ssh -i $KEYPAIR" --command ':' "$ENVIRONMENT"
    eb ssh --quiet --custom "ssh -i $KEYPAIR -N -L $PG_PORT:$ENDPOINT:5432" "$ENVIRONMENT" &
    prlog "waiting for eb ssh to connect"
    sleep 5 # let ssh connect
    prlog "attempting psql connection"

    # echo warning
    prwarn "CONNECTING TO $ENVIRONMENT"

    PG_CONNECTION_URL="postgresql://$PG_USERNAME:$PG_PASSWORD@localhost:$PG_PORT"
}

# determine eb environment
if [ -n "${1:-}" ] && [ -n "${2:-}" ]; then
    APPLICATION="$1"
    ENVIRONMENT="$2"
    pushd "$SCRIPT_DIR/../../eb/$APPLICATION" > /dev/null
else
    prusage
fi
prlog "environment: $ENVIRONMENT"
