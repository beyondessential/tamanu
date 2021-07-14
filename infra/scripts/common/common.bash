# safety first!
set -euo pipefail
trap "kill 0" EXIT # kill background processes on exit

# common variables
# https://stackoverflow.com/questions/59895/how-can-i-get-the-source-directory-of-a-bash-script-from-within-the-script-itsel
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
KEYPAIR="~/.ssh/tamanu-eb-key-pair"

# common functions
function prlog {
    echo "[script] $1"
}

function prwarn {
    MESSAGE="## $1 ##"
    echo
    echo "$MESSAGE" | sed -e 's/./#/g'
    echo "$MESSAGE"
    echo "$MESSAGE" | sed -e 's/./#/g'
    echo
}

function prusage {
    >&2 echo "Usage: $0 <application name> <short environment name>"
    >&2 echo "  e.g. '$0 tamanu-sync-server demo'"
    >&2 echo
    >&2 echo "  You will also need:"
    >&2 echo "    - jq installed"
    >&2 echo "    - the elasticbeanstalk cli installed and configured"
    >&2 echo "    - the tamanu-eb-key-pair saved in $HOME/.ssh/tamanu-eb-keypair"
    exit 1
}

# determine eb environment
if [ -n "${1:-}" ] && [ -n "${2:-}" ]; then
    ENVIRONMENT="$1-$2"
    pushd "$SCRIPT_DIR/../../eb/$1"
else
    prusage
fi
prlog "environment: $ENVIRONMENT"
