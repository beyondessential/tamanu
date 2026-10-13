/**
 * How long a server rides out a continuous loss of the database before giving up and exiting.
 * Well beyond a normal failover or switchover (seconds to tens of seconds).
 */
export const DATABASE_OUTAGE_TOLERANCE_MS = 5 * 60 * 1000;

// Sequelize wraps connect failures in these; matched by name so this package needn't depend on it
const TRANSIENT_ERROR_NAMES = new Set([
  'SequelizeConnectionRefusedError',
  'SequelizeHostNotFoundError',
  'SequelizeHostNotReachableError',
  'SequelizeConnectionTimedOutError',
]);

const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

// SQLSTATEs: admin_shutdown, crash_shutdown, cannot_connect_now (e.g. still starting up or in
// recovery), and the whole connection_exception class (08xxx)
const TRANSIENT_SQLSTATES = new Set(['57P01', '57P02', '57P03']);

interface ErrorLike {
  name?: string;
  code?: string;
  parent?: ErrorLike;
  original?: ErrorLike;
}

/**
 * Whether an error looks like the database being briefly unreachable (failover, restart, network
 * blip) rather than a problem retrying won't fix, such as bad credentials or a missing database.
 */
export const isTransientConnectionError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code, parent, original } = error as ErrorLike;
  if (name && TRANSIENT_ERROR_NAMES.has(name)) return true;
  if (code && (TRANSIENT_NETWORK_CODES.has(code) || TRANSIENT_SQLSTATES.has(code))) return true;
  if (code?.startsWith('08')) return true;
  return isTransientConnectionError(parent) || isTransientConnectionError(original);
};
