#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# ── 1. npm install ────────────────────────────────────────────────────────────
# xlsx is fetched from a CDN (cdn.sheetjs.com) that is unreachable in this
# environment. Using --ignore-scripts bypasses the fetch; native modules are
# rebuilt in the next step.
if [ ! -d node_modules/.bin ]; then
  echo "[session-start] Installing npm dependencies..."
  npm install --ignore-scripts
  echo "[session-start] Applying patches..."
  npx patch-package
  echo "[session-start] Rebuilding native modules..."
  npm rebuild
else
  echo "[session-start] node_modules already present, skipping install."
fi

# ── 2. Build shared packages ──────────────────────────────────────────────────
if [ ! -d packages/database/dist ]; then
  echo "[session-start] Building shared packages..."
  npm run build-shared
else
  echo "[session-start] Shared packages already built, skipping."
fi

# ── 3. Build central server ───────────────────────────────────────────────────
if [ ! -d packages/central-server/dist ]; then
  echo "[session-start] Building central server..."
  npm run --workspace @tamanu/central-server build
else
  echo "[session-start] Central server already built, skipping."
fi

# ── 4. PostgreSQL ─────────────────────────────────────────────────────────────
echo "[session-start] Ensuring PostgreSQL is running..."
if ! pg_lsclusters | grep -q "online"; then
  service postgresql start
fi

# Create tamanu superuser if missing
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='tamanu'" | grep -q 1; then
  echo "[session-start] Creating tamanu database user..."
  sudo -u postgres psql -c "CREATE USER tamanu WITH SUPERUSER PASSWORD 'tamanu';"
fi

# Create central database if missing
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='central'" | grep -q 1; then
  echo "[session-start] Creating central database..."
  sudo -u postgres createdb -O tamanu central
fi

# ── 5. Local config ───────────────────────────────────────────────────────────
CONFIG_FILE="packages/central-server/config/local.json5"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "[session-start] Writing local database config..."
  echo '{"db":{"host":"localhost","name":"central","username":"tamanu","password":"tamanu"}}' > "$CONFIG_FILE"
fi

# ── 6. Run migrations ─────────────────────────────────────────────────────────
echo "[session-start] Running database migrations..."
npm run --workspace @tamanu/central-server start upgrade

echo "[session-start] Done."
