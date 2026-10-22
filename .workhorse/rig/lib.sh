SERVER_CONFIG='"countryTimeZone": "Pacific/Auckland", "rateLimit": { "enabled": false }, "schedules": { "sendStatusToMetaServer": { "enabled": false } }'
export NODE_CONFIG="{ $SERVER_CONFIG }"

exec_central() { cd "$RIG_SOURCE/packages/central-server" && exec node --import tsx app "$@"; }
exec_facility() { cd "$RIG_SOURCE/packages/facility-server" && exec node --import tsx app "$@"; }
central() { (exec_central "$@"); }
facility() { (exec_facility "$@"); }
on_port() { NODE_CONFIG="{ $SERVER_CONFIG, \"port\": $1 }"; }

db_name() { base=${RIG_DATABASE_URL%%\?*}; printf '%s' "${base##*/}"; }
db_url() { base=${RIG_DATABASE_URL%%\?*}; printf '%s/%s' "${base%/*}" "$1"; }
admin_sql() { psql -qtAX -v ON_ERROR_STOP=1 "$(db_url postgres)" "$@"; }
short_hash() { node -e 'console.log(require("node:crypto").createHash("md5").update(process.argv[1]).digest("hex").slice(0, 16))' "$1"; }

# Kept outside the manager's wh_ prefix: its collection drops any database of its own that no record names.
facility_db() { printf 'tamanu_rig_f_%s' "$(short_hash "$(db_name)")"; }
facility_template() { printf 'tamanu_rig_ft_%s' "$(short_hash "$(cat "$RIG_SOURCE/../central-template")")"; }

free_ports() {
  node -e '
    const net = require("node:net");
    const servers = Array.from({ length: Number(process.argv[1]) }, () => net.createServer().listen(0, "127.0.0.1"));
    Promise.all(servers.map((s) => new Promise((r) => s.on("listening", r)))).then(() => {
      console.log(servers.map((s) => s.address().port).join(" "));
      servers.forEach((s) => s.close());
    });' "$1"
}
wait_for() { curl -so /dev/null --retry 90 --retry-all-errors --retry-delay 2 "$1"; }
sync_url() { printf 'http://facility-1%%40tamanu.io:facility-1@127.0.0.1:%s' "$1"; }
