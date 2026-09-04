/**
 * A "system" error is one the user can't act on themselves — an unclassified
 * server failure, as opposed to a specific action failing (see
 * `classifyApiError`'s `SERVER` kind). These no longer interrupt the user with
 * a toast. This is a first pass that only logs, standing in for a future
 * 'System errors' view where they can be reviewed without needing eye contact
 * the moment they happen.
 */
export function relegateSystemError(error, endpoint) {
  // eslint-disable-next-line no-console
  console.error('[System error] relegated:', { endpoint, error });
}
