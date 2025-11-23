import { v4 } from 'uuid';

const generators: Record<string, () => string> = {
  A: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  '0': () => Math.floor(Math.random() * 10).toFixed(0),
};

const createIdGenerator = (format: string) => {
  const generatorPattern = Array.from(format).map(char => generators[char] || (() => ''));

  return () => generatorPattern.map(generator => generator()).join('');
};
const DISPLAY_ID_FORMAT = 'AAAA000000';
export const generateId = createIdGenerator(DISPLAY_ID_FORMAT);

// Checks if the passed displayId was generated using generateId function above
// with the specific 10 digit format DISPLAY_ID_FORMAT. It will need to be reevaluated
// if the format ever changes.
export const isGeneratedDisplayId = (displayId: string) => {
  if (DISPLAY_ID_FORMAT !== 'AAAA000000') return false;
  return /^[A-Z]{4}\d{6}$/.test(displayId);
};

/*
 * This regex is used to match each token in the pattern.
 * It will match groups of characters wrapped in [] or single A or 0.
 */
const PATTERN_TOKEN_REGEX = /(\[.+?\])(?=\[|[A0]|$)|[A0]/g;

const tokenAsRegex = (token: string) => {
  if (token.startsWith('[') && token.endsWith(']')) {
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
  return pattern.replace(PATTERN_TOKEN_REGEX, token => {
    if (token.startsWith('[') && token.endsWith(']')) {
      return token.slice(1, -1);
    }
    return generators[token]?.() || '';
  });
};

/**
 * 
 * @param displayId - The display ID to validate.
 * @param pattern - The pattern to use for validating the display ID.
 * @returns True if the display ID matches the pattern, false otherwise.
 * @example
 * isGeneratedDisplayIdFromPattern('GHIJ675432', 'AAAA000000') // true
 * isGeneratedDisplayIdFromPattern('BCHIJA125', '[BC]AA[A]000') // true
 * isGeneratedDisplayIdFromPattern('B350031', '[B]AA[A]000') // false
 */
export const isGeneratedDisplayIdFromPattern = (displayId: string, pattern: string) => {
  const patternTokens = pattern.match(PATTERN_TOKEN_REGEX);
  if (!patternTokens) return false;
  const expression = patternTokens.reduce((acc, token) => acc + tokenAsRegex(token), '');
  const patternRegex = new RegExp(`^${expression}$`);
  return patternRegex.test(displayId);
};

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
  return v4().replace(/(.{8}-.{4})-.{4}-(.+)/, '$1-0000-$2');
};

export const FAKE_UUID_PATTERN = '________-____-0000-____-____________';
