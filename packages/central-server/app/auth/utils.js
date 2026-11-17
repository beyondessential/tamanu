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

// spec: SETTINGS
/**
 * Throws unless both token signing secrets are set to non-empty values.
 */
export const assertAuthSecretsConfigured = () => {
  const missingSecrets = Object.entries({
    AUTH_SECRET: getAuthSecret(),
    AUTH_REFRESH_TOKEN_SECRET: getRefreshTokenSecret(),
  })
    .filter(([, secret]) => typeof secret !== 'string' || secret.trim() === '')
    .map(([name]) => name);

  if (missingSecrets.length > 0) {
    throw new Error(
      `Token signing secrets are not configured: set ${missingSecrets.join(' and ')}`,
    );
  }
};

export const buildToken = async (data, secret, options) => {
  if (!secret) {
    secret = getAuthSecret();
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
