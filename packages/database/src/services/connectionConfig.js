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
 * A single connection string — `DATABASE_URL` (env) or `db.url` (config) —
 * describes the connection. When present it wins for the connection target and
 * credentials, and any pool settings in its query string merge over the
 * structured `pool`. When absent the structured config is returned untouched,
 * so existing deployments keep working (additive, backwards compatible).
 *
 * Env takes precedence over config so a deployment can override the file.
 * Callers spread the result and may still override individual fields (e.g. the
 * reporting connections reuse the resolved host/name but set their own user).
 */
export const resolveDbConfig = (dbConfig = {}) => {
  const url = process.env.DATABASE_URL ?? dbConfig.url;
  if (!url) return dbConfig;

  const parsed = parse(url);
  const rest = { ...dbConfig };
  delete rest.url;
  return {
    ...rest,
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
