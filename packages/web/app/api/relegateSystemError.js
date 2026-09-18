import { v4 as uuidv4 } from 'uuid';

/**
 * A "system" error is one the user can't act on themselves — an unclassified
 * server failure, as opposed to a specific action failing (see
 * `classifyApiError`'s `SERVER` kind). These no longer interrupt the user with
 * a toast; instead they're recorded for review in the 'System errors' view.
 *
 * spec: SYSERR#relegating-server-errors
 */
export function buildSystemError(error, endpoint) {
  const path = error?.path ?? endpoint;
  const detail = error?.title ?? error?.message ?? 'Unknown error';
  const message = `${path}: ${detail}`;

  return { id: uuidv4(), timestamp: new Date().toISOString(), message };
}
