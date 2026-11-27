node_major=$(node -p 'process.versions.node.split(".")[0]')
wanted_major=$(sed 's/^v//; s/\..*//' "$RIG_SOURCE/.nvmrc")
if [ "$node_major" != "$wanted_major" ]; then
  echo "node $node_major is first on PATH, and this commit's .nvmrc wants $wanted_major" >&2
  exit 1
fi

SERVER_CONFIG='"rateLimit": { "enabled": false }'
# The servers bind PORT over their config's port, and the rig sets PORT to the lease's.
unset PORT
export NODE_CONFIG="{ $SERVER_CONFIG }"

# The servers refuse to start without a key file (config crypto.keyFile). One per kind of server is
# made once per build, beside its source, so the seeded templates and every lease cloned from them
# read the secrets they hold with the same key.
key_file() {
  file="$RIG_SOURCE/../$1-secret.key"
  [ -s "$file" ] || head -c 32 /dev/urandom > "$file"
  printf '%s' "$file"
}
exec_central() {
  CRYPTO_KEY_FILE=$(key_file central) && export CRYPTO_KEY_FILE
  cd "$RIG_SOURCE/packages/central-server" && exec node --import tsx app "$@"
}
exec_facility() {
  CRYPTO_KEY_FILE=$(key_file facility) && export CRYPTO_KEY_FILE
  cd "$RIG_SOURCE/packages/facility-server" && exec node --import tsx app "$@"
}
central() { (exec_central "$@"); }
facility() { (exec_facility "$@"); }
# The servers listen on every interface unless BIND_ADDRESS says otherwise.
on_port() { NODE_CONFIG="{ $SERVER_CONFIG, \"port\": $1 }"; export BIND_ADDRESS="127.0.0.1:$1"; }

db_name() { base=${RIG_DATABASE_URL%%\?*}; printf '%s' "${base##*/}"; }
db_url() { base=${RIG_DATABASE_URL%%\?*}; printf '%s/%s' "${base%/*}" "$1"; }
sql() { node "$RIG_RECIPE_DIR/sql.mjs" "$@"; }
admin_sql() { sql "$(db_url postgres)" "$@"; }
short_hash() { node -e 'console.log(require("node:crypto").createHash("md5").update(process.argv[1]).digest("hex").slice(0, 16))' "$1"; }

# Kept outside the manager's wh_ prefix: its collection drops any database of its own that no record names.
# Each takes the facility's number, 1 or 2.
facility_db() { printf 'tamanu_rig_f%s_%s' "$1" "$(short_hash "$(db_name)")"; }
facility_template() { printf 'tamanu_rig_ft%s_%s' "$1" "$(short_hash "$(cat "$RIG_SOURCE/../central-template")")"; }

# The manager picks RIG_PORT without holding it, so the OS can hand it out again.
free_ports() {
  node -e '
    const net = require("node:net");
    const servers = Array.from({ length: Number(process.argv[1]) + 1 }, () => net.createServer().listen(0, "127.0.0.1"));
    Promise.all(servers.map((s) => new Promise((r) => s.on("listening", r)))).then(() => {
      const ports = servers.map((s) => s.address().port).filter((port) => String(port) !== process.env.RIG_PORT);
      console.log(ports.slice(0, Number(process.argv[1])).join(" "));
      servers.forEach((s) => s.close());
    });' "$1"
}
wait_for() { curl -fso /dev/null --max-time 5 --retry 90 --retry-all-errors --retry-delay 2 "$1"; }
sync_url() { printf 'http://facility-%s%%40tamanu.io:facility-%s@127.0.0.1:%s' "$2" "$2" "$1"; }
