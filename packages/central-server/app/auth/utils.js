import { createSecretKey, randomBytes, randomInt } from 'node:crypto';
import * as jose from 'jose';

import { getAuthSecret, getRefreshTokenSecret } from '@tamanu/shared/utils';

import { JWT_KEY_ALG, JWT_KEY_ID, SERVER_TYPES } from '@tamanu/constants';

const MAX_U32_VALUE = 2 ** 32 - 1;

export const stripUser = user => {
  const userData = { ...user };
  delete userData.password;
  return userData;
};

const MIN_SECRET_LENGTH = 16;
const MIN_SECRET_ENTROPY_BITS = 40;

/**
 * Estimates a secret's entropy from how often each of its characters repeats. It cannot
 * spot a guessable phrase, only a degenerate value such as `0000000000000004`.
 */
const estimateEntropyBits = secret => {
  const characters = [...secret];
  const characterCounts = new Map();
  for (const character of characters) {
    characterCounts.set(character, (characterCounts.get(character) ?? 0) + 1);
  }
  return [...characterCounts.values()].reduce(
    (bits, count) => bits - count * Math.log2(count / characters.length),
    0,
  );
};

const isWeakSecret = secret =>
  [...secret].length < MIN_SECRET_LENGTH || estimateEntropyBits(secret) < MIN_SECRET_ENTROPY_BITS;

// spec: SETTINGS
/**
 * Throws unless both token signing secrets are set, at least 16 characters long, and not
 * made of a few repeated characters.
 */
export const assertAuthSecretsConfigured = () => {
  const secrets = Object.entries({
    AUTH_SECRET: getAuthSecret(),
    AUTH_REFRESH_TOKEN_SECRET: getRefreshTokenSecret(),
  });
  const missingSecrets = secrets
    .filter(([, secret]) => typeof secret !== 'string' || secret.trim() === '')
    .map(([name]) => name);
  const weakSecrets = secrets
    .filter(([name, secret]) => !missingSecrets.includes(name) && isWeakSecret(secret))
    .map(([name]) => name);

  const problems = [];
  if (missingSecrets.length > 0) {
    problems.push(`set ${missingSecrets.join(' and ')}`);
  }
  if (weakSecrets.length > 0) {
    problems.push(
      `make ${weakSecrets.join(' and ')} at least ${MIN_SECRET_LENGTH} characters of random text`,
    );
  }
  if (problems.length > 0) {
    throw new Error(`Token signing secrets are missing or too weak: ${problems.join('; ')}`);
  }
};

export const buildToken = async (data, secret, options) => {
  if (!secret) {
    throw new Error('Token signing secret is not configured');
  }

  if (typeof secret === 'string') {
    secret = createSecretKey(new TextEncoder().encode(secret));
  }

  return await new jose.SignJWT(data)
    .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
    .setJti(randomBytes(32).toString('base64url'))
    .setIssuedAt()
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .setExpirationTime(options.expiresIn)
    .sign(secret);
};

export const getRandomBase64String = async (length, encoding = 'base64') => {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString(encoding));
    });
  });
};

export const getRandomU32 = () => {
  return randomInt(0, MAX_U32_VALUE);
};

export const verifyToken = async (token, tokenSecret, options) => {
  const secret = createSecretKey(new TextEncoder().encode(tokenSecret));
  return await jose.jwtVerify(token, secret, options);
};

export const findUserById = async (models, id) => {
  const user = await models.User.findByPk(id);
  if (!user) {
    return null;
  }
  return user.get({ plain: true });
};

export const isInternalClient = client => Object.values(SERVER_TYPES).includes(client);
