import { v4 as uuidv4 } from 'uuid';

/**
 * A "system" error is one the user can't act on themselves — an unclassified
 * server failure, as opposed to a specific action failing (see
 * `classifyApiError`'s `SERVER` kind). These no longer interrupt the user with
 * a toast; instead they're recorded for review in the 'System errors' view.
 *
 * spec: SYSERR#relegating-server-errors
 */
// Keeps every part that adds something, skipping any contained in another part
// (in either order), and preserving the order of the parts kept.
function joinDistinctParts(parts, separator) {
  const presentParts = [...new Set(parts.filter(Boolean))];
  return presentParts
    .filter(part => !presentParts.some(otherPart => otherPart !== part && otherPart.includes(part)))
    .join(separator);
}

export function buildSystemError(error, endpoint) {
  const path = joinDistinctParts([endpoint, error?.path], ' ');
  const detail = joinDistinctParts([error?.message, error?.title], ' — ') || 'Unknown error';
  const message = `${path}: ${detail}`;

  return { id: uuidv4(), timestamp: new Date().toISOString(), message };
}
