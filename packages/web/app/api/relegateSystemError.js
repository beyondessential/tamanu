import { v4 as uuidv4 } from 'uuid';

let handler = null;

/**
 * Set by index.js at startup so this module (called from TamanuApi.jsx, outside the
 * React tree) can reach the systemErrors Redux slice — the store instance itself
 * lives in index.js's closure, not exported for import elsewhere (see how
 * setAuthFailureHandler bridges the same gap for auth failures, as a field on the
 * API singleton rather than a module-level one).
 */
export function setSystemErrorHandler(nextHandler) {
  handler = nextHandler;
}

/**
 * A "system" error is one the user can't act on themselves — an unclassified
 * server failure, as opposed to a specific action failing (see
 * `classifyApiError`'s `SERVER` kind). These no longer interrupt the user with
 * a toast; instead they're recorded for review in the 'System errors' view.
 *
 * spec: SYSERR#relegating-server-errors
 */
export function relegateSystemError(error, endpoint) {
  const path = error?.path ?? endpoint;
  const message = `Something went wrong on the server. Path: ${path}. Message: ${error?.title ?? error?.message ?? 'Unknown error'}`;

  if (handler) {
    handler({ id: uuidv4(), timestamp: new Date().toISOString(), message });
  } else {
    // eslint-disable-next-line no-console
    console.error('[System error] relegated (no handler registered):', { endpoint, error });
  }
}
