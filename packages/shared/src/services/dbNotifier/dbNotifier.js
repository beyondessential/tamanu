import pg from 'pg';
import { defineHook } from './hook';

import { BACKEND_HOOKS, NOTIFY_CHANNELS } from '@tamanu/constants';
import {
  DATABASE_CONNECT_TIMEOUT_MS,
  DATABASE_OUTAGE_TOLERANCE_MS,
  isTransientConnectionError,
} from '@tamanu/utils/databaseOutage';
import { retryWithBackoff } from '@tamanu/utils/retryWithBackoff';
import { log } from '../logging';

const CHANNEL_TO_HOOK = {
  [NOTIFY_CHANNELS.TABLE_CHANGED]: BACKEND_HOOKS.DATABASE_TABLE_CHANGED,
  [NOTIFY_CHANNELS.MATERIALIZED_VIEW_REFRESHED]: BACKEND_HOOKS.DATABASE_MATERIALIZED_VIEW_REFRESHED,
  [NOTIFY_CHANNELS.JOBS]: BACKEND_HOOKS.DATABASE_JOBS_NOTIFY,
};

const parsePayload = payload => {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

/**
 * An `onOutageExceeded` handler for server processes: exit, and let the supervisor restart us.
 */
export const exitOnDatabaseOutage = error => {
  log.error('dbNotifier: database unavailable for too long, exiting', { error: error.message });
  process.exit(1);
};

/**
 * Define db notifier for multiple events.
 *
 * Holds one dedicated connection that LISTENs on the given channels. If the connection is lost
 * (e.g. a database failover) it reconnects with backoff and listens again, so the process keeps
 * running. NOTIFYs sent while disconnected are lost: use `onReconnect` to refresh anything that
 * depends on them. If a lost connection can't be re-established within `outageToleranceMs`, the
 * notifier stops listening for good and calls `onOutageExceeded`; the caller decides what that
 * means for the process (servers pass `exitOnDatabaseOutage`). The initial connection is retried
 * the same way, but on failure the returned promise rejects instead.
 *
 * @param {{host: string, port: number, database: string, username: string, password: string}} config
 * @param {string[]} channels
 * @param {{outageToleranceMs?: number, onOutageExceeded: (error: Error) => void}} options
 */
export const defineDbNotifier = async (
  config,
  channels,
  { outageToleranceMs = DATABASE_OUTAGE_TOLERANCE_MS, onOutageExceeded },
) => {
  if (typeof onOutageExceeded !== 'function') {
    throw new Error('defineDbNotifier: onOutageExceeded is required');
  }

  // Define hooks dynamically based on channels
  const hooks = {};
  channels.forEach(channel => {
    hooks[channel] = defineHook(CHANNEL_TO_HOOK[channel]);
  });

  const reconnectListeners = [];
  const closing = new AbortController();
  let client = null;
  // the attempt in flight, so close() can end it too
  let connecting = null;
  let reconnecting = false;

  const dispatch = ({ channel, payload }) => {
    hooks[channel]
      ?.trigger(parsePayload(payload))
      .catch(error => log.error('dbNotifier: listener failed', { channel, error }));
  };

  const connectOnce = async () => {
    const next = new pg.Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: DATABASE_CONNECT_TIMEOUT_MS,
    });
    connecting = next;

    // An 'error' event with no listener would crash the process, so listen from the start. Both
    // events mean the connection is gone; ignore it if it isn't the live one (a failed attempt, or
    // one we already replaced or closed)
    const onLost = error => {
      if (client === next) handleConnectionLost(error);
    };
    next.on('error', onLost);
    next.on('end', onLost);
    next.on('notification', dispatch);

    try {
      await next.connect();
      for (const channel of channels) {
        await next.query(`LISTEN ${next.escapeIdentifier(channel)}`);
      }
      // closed while connecting
      if (closing.signal.aborted) throw new Error('dbNotifier closed');
    } catch (error) {
      next.end().catch(() => {});
      throw error;
    } finally {
      connecting = null;
    }
    client = next;
  };

  const connectWithRetry = () =>
    retryWithBackoff(connectOnce, {
      maxElapsedMs: outageToleranceMs,
      isRetryable: isTransientConnectionError,
      signal: closing.signal,
      onRetry: ({ error, attempt, nextDelayMs, elapsedMs }) =>
        log.warn('dbNotifier: database unavailable, retrying', {
          attempt,
          nextDelayMs,
          elapsedMs,
          error: error.message,
        }),
    });

  const handleConnectionLost = async error => {
    if (reconnecting || closing.signal.aborted) return;
    reconnecting = true;
    const lost = client;
    client = null;
    lost.end().catch(() => {});
    log.warn('dbNotifier: connection lost, reconnecting', { error: error?.message });

    try {
      await connectWithRetry();
    } catch (reconnectError) {
      if (!closing.signal.aborted) onOutageExceeded(reconnectError);
      return;
    } finally {
      // the guard above means only one reconnect runs at a time
      // eslint-disable-next-line require-atomic-updates
      reconnecting = false;
    }
    log.info('dbNotifier: reconnected');
    reconnectListeners.forEach(listener => listener());
  };

  await connectWithRetry();

  const close = async () => {
    closing.abort();
    connecting?.end().catch(() => {});
    const closed = client;
    client = null;
    await closed?.end();
  };

  // Return an object with the dynamically created 'on' functions and the close function
  const listeners = channels.reduce((acc, channel) => {
    acc[channel] = hooks[channel].on;
    return acc;
  }, {});

  return {
    listeners,
    // Called after the connection is re-established; notifications sent meanwhile were missed
    onReconnect: listener => {
      reconnectListeners.push(listener);
    },
    close,
  };
};
