import { sign as signCallback, verify as verifyCallback } from 'jsonwebtoken';
import { randomBytes, randomInt } from 'crypto';
import { promisify } from 'util';

import { SERVER_TYPES } from '@tamanu/constants';

const sign = promisify(signCallback);
const verify = promisify(verifyCallback);

const MAX_U32_VALUE = 2 ** 32 - 1;

export const stripUser = user => {
  const userData = { ...user };
  delete userData.password;
  return userData;
};

export const getToken = async (data, secret, options) => sign(data, secret, options);

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

export const verifyToken = async (token, secret, options) => verify(token, secret, options);

export const findUserById = async (models, id) => {
  const user = await models.User.findByPk(id);
  if (!user) {
    return null;
  }
  return user.get({ plain: true });
};

export const isInternalClient = client => Object.values(SERVER_TYPES).includes(client);
