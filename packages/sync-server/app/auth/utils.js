import config from 'config';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = config.auth.secret || uuid();

export const FAKE_TOKEN = 'fake-token';

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = async (user, expiry) => {
  return jwt.sign({ userId: user.id }, JWT_SECRET);
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
