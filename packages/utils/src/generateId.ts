import { DEFAULT_PATIENT_DISPLAY_ID_PATTERN } from '@tamanu/constants';
import { randomUUID } from 'node:crypto';

const generators: Record<string, () => string> = {
  A: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  '0': () => Math.floor(Math.random() * 10).toFixed(0),
};

// Max pattern length to avoid ReDoS with PATTERN_TOKEN_REGEX on long input
const MAX_PATTERN_LENGTH = 255;

/*
 * This regex is used to match each token in the pattern.
 * It will match groups of characters wrapped in [] or single A or 0.
 */
const PATTERN_TOKEN_REGEX = /(\[.+?\])(?=\[|[A0]|$)|[A0]/g;

const tokenAsRegex = (token: string) => {
  if (token.startsWith('[') && token.endsWith(']')) {
    // Escape special characters in the token to use in a regex
    return token.slice(1, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  if (token === 'A') {
    return '[A-Z]';
  }
  if (token === '0') {
    return '[0-9]';
  }
  throw new Error(`Invalid token: ${token}`);
};


/**
 * Generates an ID from a pattern.
 * A will be replaced with a random letter and 0 will be replaced with a random number.
 * Wrapping characters in [] will allow static characters to be used.
 * @param pattern - The pattern to use for generating the ID.
 * @returns The generated ID.
 * @example
 * generateIdFromPattern('AAAA000000') // 'GHIJ675432'
 * generateIdFromPattern('[B]000000') // 'B675432'
 * generateIdFromPattern('[B]AA[A]000') // 'BGHA675'
 */
export const generateIdFromPattern = (pattern: string) => {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Pattern length exceeds maximum of ${MAX_PATTERN_LENGTH}`);
  }
  return pattern.replace(PATTERN_TOKEN_REGEX, token => {
    if (token.startsWith('[') && token.endsWith(']')) {
      return token.slice(1, -1);
    }
    return generators[token]?.() ?? '';
  });
};

export const generateId = () => generateIdFromPattern(DEFAULT_PATIENT_DISPLAY_ID_PATTERN);

/**
 * Validates if a display ID matches a given pattern.
 * @param displayId - The display ID to validate.
 * @param pattern - The pattern to use for validating the display ID.
 * @returns True if the display ID matches the pattern, false otherwise.
 * @example
 * isGeneratedIdFromPattern('GHIJ675432', 'AAAA000000') // true
 * isGeneratedIdFromPattern('BCDEFA123', '[BC]AA[A]000') // true
 * isGeneratedIdFromPattern('B350031', '[B]AA[A]000') // false
 */
export const isGeneratedIdFromPattern = (displayId: string, pattern: string) => {
  if (pattern.length > MAX_PATTERN_LENGTH) return false;
  const patternTokens = pattern.match(PATTERN_TOKEN_REGEX);
  if (!patternTokens) return false;
  const expression = patternTokens.reduce((acc, token) => acc + tokenAsRegex(token), '');
  const patternRegex = new RegExp(`^${expression}$`);
  return patternRegex.test(displayId);
};

/** True if `displayId` matches the default patient display-id pattern (`generateId`). */
export const isGeneratedDisplayId = (displayId: string) =>
  isGeneratedIdFromPattern(displayId, DEFAULT_PATIENT_DISPLAY_ID_PATTERN);

/**
 * Makes a 'fake' but valid uuid like '2964ea0d-073d-0000-bda1-ce47fd5de340'.
 *
 * This is built from a UUID v4, but replacing this particular segment means
 * we're also replacing the V4 indication, making this a "version zero" UUID,
 * which doesn't exist and thus cannot conflict with "naturally generated" ones.
 * Yet it will fit in 128-bit binary representation types and also in 36-bytes
 * (or variable width) text representations types.
 *
 * This is used to run tests against real data, where we're able to clear out
 * everything that was created by the tests with just a simple query. See the
 * accompanying FAKE_UUID_PATTERN constant for the SQL LIKE pattern to use.
 */
export const fakeUUID = () => {
  return randomUUID().replace(/(.{8}-.{4})-.{4}-(.+)/, '$1-0000-$2');
};

export const FAKE_UUID_PATTERN = '________-____-0000-____-____________';
