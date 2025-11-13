// Utility helpers for working with passwords

/**
 * Check whether a given string looks like a bcrypt hash.
 *
 * Bcrypt hashes start with one of the prefixes: $2a$, $2b$, or $2y$,
 * followed by a cost factor and salt segments. This heuristic avoids
 * rehashing already-hashed passwords during migrations or sync.
 */
export function isBcryptHash(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false;
  // Same heuristic used in `packages/database/src/models/User.ts`
  return /^\$2[aby]\$\d{1,2}\$/.test(candidate);
}
