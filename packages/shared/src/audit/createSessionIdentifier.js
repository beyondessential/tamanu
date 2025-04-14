import crypto from 'crypto';

export function createSessionIdentifier(token) {
  // Creates a unique session identifier from the token
  return crypto.createHash('sha256').update(token).digest('hex').slice(-32);
}
