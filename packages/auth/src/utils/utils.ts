import {
  sign as signCallback,
  verify as verifyCallback,
  SignOptions,
  VerifyOptions,
  Jwt,
  JwtPayload,
} from 'jsonwebtoken';
import { randomBytes, randomInt } from 'crypto';
import { promisify } from 'util';

import { SERVER_TYPES } from '@tamanu/constants';
import { type ModelProperties } from '@tamanu/database/types';
import { type User, type Models } from '@tamanu/database';

const sign = promisify(signCallback);
const verify = promisify(verifyCallback);

const MAX_U32_VALUE = 2 ** 32 - 1;

export const stripUser = (user: ModelProperties<User>): Omit<ModelProperties<User>, 'password'> => {
  const userData = { ...user };
  delete userData.password;
  return userData;
};

export const buildToken = async (
  data: object | string,
  secret: string,
  options: SignOptions,
): Jwt => sign(data, secret, options);

export const verifyToken = async (token: Jwt, secret: string, options: VerifyOptions): JwtPayload =>
  verify(token, secret, options);

export const getRandomBase64String = async (
  length: number,
  encoding: BufferEncoding = 'base64',
): Promise<string> => {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString(encoding));
    });
  });
};

export const getRandomU32 = (): number => {
  return randomInt(0, MAX_U32_VALUE);
};

export const findUserById = async (models: Models, id: string): Promise<User> => {
  const user = await models.User.findByPk(id);
  if (!user) {
    return null;
  }
  return user.get({ plain: true });
};

export const isInternalClient = (client: string): boolean =>
  Object.values(SERVER_TYPES).includes(client);
