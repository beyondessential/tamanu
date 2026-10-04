import { v4 as uuidv4 } from 'uuid';

/**
 * A "system" error is one the user can't act on themselves — an unclassified
 * server failure, as opposed to a specific action failing (see
 * `classifyApiError`'s `SERVER` kind). These no longer interrupt the user with
 * a toast; instead they're recorded for review in the 'System errors' view.
 *
 * spec: SYSERR#relegating-server-errors
 */
// Keeps every part that adds something, skipping any already contained in an
// earlier one.
function joinDistinctParts(parts, separator) {
  const keptParts = [];
  for (const part of parts) {
    if (part && !keptParts.some(keptPart => keptPart.includes(part))) {
      keptParts.push(part);
    }
  }
  return keptParts.join(separator);
}

export function buildSystemError(error, endpoint) {
  const path = joinDistinctParts([endpoint, error?.path], ' ');
  // message first: for a Problem it is `title` or `title: detail`, a superset of title
  const detail = joinDistinctParts([error?.message, error?.title], ' — ') || 'Unknown error';
  const message = `${path}: ${detail}`;

  return { id: uuidv4(), timestamp: new Date().toISOString(), message };
}
