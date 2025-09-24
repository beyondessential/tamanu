import { createSecretKey, randomBytes, randomInt } from 'node:crypto';
import config from 'config';
import * as jose from 'jose';

import { SERVER_TYPES } from '@tamanu/constants';

const MAX_U32_VALUE = 2 ** 32 - 1;

export const stripUser = user => {
  const userData = { ...user };
  delete userData.password;
  return userData;
};

export const buildToken = async (data, secret, options) => {
  if (!secret) {
    secret = config.auth.secret ?? crypto.randomUUID();
  }

  if (typeof secret === 'string') {
    secret = createSecretKey(new TextEncoder().encode(secret));
  }

  return await new jose.SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
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
