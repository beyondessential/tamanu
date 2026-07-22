import { parse } from 'pg-connection-string';

// Sequelize pool settings that can be supplied as query-string params on the
// connection URL, e.g. `?max=10&min=2&idle=10000`.
const POOL_KEYS = ['max', 'min', 'idle', 'acquire', 'evict'];

const poolFromConnectionString = parsed => {
  const pool = {};
  for (const key of POOL_KEYS) {
    if (parsed[key] !== undefined && parsed[key] !== '') {
      pool[key] = Number(parsed[key]);
    }
  }
  return pool;
};

/**
 * Resolve the effective database config for the core ("tamanu") user.
 *
 * When the `DATABASE_URL` env var is set it describes the connection: it wins
 * for the connection target and credentials, and any pool settings in its query
 * string merge over the structured `pool`. When unset the structured ("keyed")
 * config is returned untouched, so existing deployments keep working.
 *
 * Callers spread the result and may still override individual fields (e.g. the
 * reporting connections reuse the resolved host/name but set their own user).
 */
/**
 * Postgres startup options (the `options` connection parameter): session GUCs
 * applied to every pooled connection at connect time, no per-connect round
 * trip. Currently just idle_in_transaction_session_timeout, which aborts
 * sessions left idle inside an open transaction so a stuck process can't hold
 * locks forever. Milliseconds; unset/zero/invalid disables.
 */
export const pgStartupOptions = ({ idleInTransactionSessionTimeout } = {}) => {
  const ms = Number(idleInTransactionSessionTimeout);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return `-c idle_in_transaction_session_timeout=${Math.floor(ms)}`;
};

export const resolveDbConfig = (dbConfig = {}) => {
  const url = process.env.DATABASE_URL;
  if (!url) return dbConfig;

  // pg-connection-string is lenient and won't reject junk, so check the scheme
  // here and fail with a clear message rather than a vague connection error later.
  // (A prefix check, not `new URL`, because that rejects the valid unix-socket
  // form `postgresql://user@/db?host=/path`.)
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL must be a postgres:// or postgresql:// connection string');
  }

  const parsed = parse(url);
  return {
    ...dbConfig,
    name: parsed.database ?? dbConfig.name,
    username: parsed.user ?? dbConfig.username,
    password: parsed.password ?? dbConfig.password,
    host: parsed.host ?? dbConfig.host,
    // The URL is the source of truth for the connection target: an empty port
    // (unix socket, or default) resolves to null rather than the structured port.
    port: parsed.port ? Number(parsed.port) : null,
    pool: { ...dbConfig.pool, ...poolFromConnectionString(parsed) },
  };
};
