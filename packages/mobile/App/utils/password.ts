export function isBcryptHash(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false;
  // Same heuristic used in `packages/database/src/models/User.ts`
  return /^\$2[aby]\$\d{1,2}\$/.test(candidate);
}
