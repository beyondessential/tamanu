import crypto from 'crypto';

/**
 * Maps a string to a stable integer (e.g. for PostgreSQL advisory lock keys).
 * Stays within JS safe integer range. Same string always yields the same number.
 * @param {string} text
 * @returns {number}
 */
export const stringToStableInteger = text =>
  Number(`0x${crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12)}`);
