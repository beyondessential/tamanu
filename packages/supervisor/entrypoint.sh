#!/bin/sh
# The frontend image's entrypoint. "supervisor [run|adapt|validate] [flags]"
# checks the supervisor's environment for the obvious mistakes, fills in its
# defaults and runs Caddy with the supervisor's Caddyfile and any further flags.
# Anything else is Caddy's command line, run as given.
#
# spec: SUPV#configuration
set -euf

CADDY=${CADDY:-/usr/bin/caddy}
CADDYFILES=${CADDYFILES:-/etc/caddy/supervisor}

[ "${1-}" = supervisor ] || exec "$CADDY" "$@"
shift
command=${1:-run}
[ $# -eq 0 ] || shift
case $command in
run | adapt | validate) ;;
*) echo "supervisor: $command is not run, adapt or validate" >&2 && exit 2 ;;
esac

P=TAMANU_SUPERVISOR_
known=" ROLE LISTEN PORTAL_LISTEN STATUS_LISTEN API_UPSTREAMS WEB_ROOT PORTAL_ROOT ACTUATOR_URL IDLE_TIME API_TOKEN TRUSTED_PROXIES "
problems=
fail() { problems="$problems$P$1 $2
"; }
get() { eval "printf %s \"\${$P$1-}\""; }
is_number() { case $1 in '' | *[!0-9]*) false ;; esac; }

for name in $(env | sed -n "s/^$P\([A-Za-z0-9_]*\)=.*/\1/p"); do
	case $known in *" $name "*) ;; *) fail "$name" "is not a variable the supervisor reads" ;; esac
done

# A platform proxy is always in front, and without it named every client shares
# the proxy's rate limits.
for name in ROLE API_UPSTREAMS WEB_ROOT TRUSTED_PROXIES; do
	[ -n "$(get $name)" ] || fail $name "is required"
done

role=$(get ROLE)
case $role in
central) idle=15m ;;
facility | '') idle=30m ;;
*) idle=30m && fail ROLE "must be central or facility, not \"$role\"" ;;
esac
export TAMANU_SUPERVISOR_LISTEN="${TAMANU_SUPERVISOR_LISTEN:-:8080}"
export TAMANU_SUPERVISOR_STATUS_LISTEN="${TAMANU_SUPERVISOR_STATUS_LISTEN:-127.0.0.1:8081}"
export TAMANU_SUPERVISOR_IDLE_TIME="${TAMANU_SUPERVISOR_IDLE_TIME:-$idle}"

for name in LISTEN STATUS_LISTEN PORTAL_LISTEN; do
	address=$(get $name)
	[ -z "$address" ] && continue
	case $address in *:*) is_number "${address##*:}" && continue ;; esac
	fail $name "must be an address such as :8080 or 127.0.0.1:8080, not \"$address\""
done

for upstream in $(get API_UPSTREAMS); do
	case $upstream in *,*) ;; ?*:*) is_number "${upstream##*:}" && continue ;; esac
	fail API_UPSTREAMS "must be a space-separated list of host:port addresses, and \"$upstream\" is not one"
done

for range in $(get TRUSTED_PROXIES); do
	case $range in *,*) ;; ?*/*) is_number "${range##*/}" && continue ;; esac
	fail TRUSTED_PROXIES "must be a space-separated list of CIDR ranges, and \"$range\" is not one"
done

case $(get IDLE_TIME) in
*[!0-9.hmnsu]* | [!0-9]* | *[!hms]) fail IDLE_TIME "must be a duration such as 30m or 1h, not \"$(get IDLE_TIME)\"" ;;
esac

case $(get ACTUATOR_URL) in
'') ;;
http://?* | https://?*) [ -n "$(get API_TOKEN)" ] || fail API_TOKEN "is required when ${P}ACTUATOR_URL is set" ;;
*) fail ACTUATOR_URL "must be an http or https URL" ;;
esac

caddyfile=$CADDYFILES/supervisor.caddyfile
if [ -n "$(get PORTAL_LISTEN)" ]; then
	[ "$role" != facility ] || fail PORTAL_LISTEN "is only for a central server"
	[ -n "$(get PORTAL_ROOT)" ] || fail PORTAL_ROOT "is required when ${P}PORTAL_LISTEN is set"
	caddyfile=$CADDYFILES/supervisor-portal.caddyfile
	export _TAMANU_SUPERVISOR_PORTAL_PORT="${TAMANU_SUPERVISOR_PORTAL_LISTEN##*:}"
fi

if [ -n "$problems" ]; then
	printf %s "$problems" >&2
	exit 1
fi

# A Caddyfile's site address gives the port, and bind the host.
export _TAMANU_SUPERVISOR_PORT="${TAMANU_SUPERVISOR_LISTEN##*:}"
export _TAMANU_SUPERVISOR_STATUS_PORT="${TAMANU_SUPERVISOR_STATUS_LISTEN##*:}"
exec "$CADDY" "$command" --config "$caddyfile" --adapter caddyfile "$@"
