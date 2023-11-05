import express from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuid } from 'uuid';
import config from 'config';
import { getLanguageOptions } from '@tamanu/shared/utils/translation/getLanguageOptions';

import { getPermissions } from 'shared/permissions/middleware';

import { convertFromDbRecord } from '../convertDbRecord';
import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';
import { refresh } from './refresh';
import { userMiddleware, userInfo } from './userMiddleware';

export const DEFAULT_JWT_SECRET = config.auth.secret || uuid();
export const DEFAULT_JWT_REFRESH_SECRET = config.auth.refreshToken.secret || uuid();

export const authModule = express.Router();

authModule.use('/resetPassword', resetPassword);
authModule.use('/changePassword', changePassword);
authModule.post(
  '/login',
  login({ secret: DEFAULT_JWT_SECRET, refreshSecret: DEFAULT_JWT_REFRESH_SECRET }),
);
authModule.post(
  '/refresh',
  refresh({ secret: DEFAULT_JWT_SECRET, refreshSecret: DEFAULT_JWT_REFRESH_SECRET }),
);

authModule.use(userMiddleware({ secret: DEFAULT_JWT_SECRET }));
authModule.get('/user/me', userInfo);

authModule.get('/permissions', asyncHandler(getPermissions));
authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);
authModule.get('/translation/preLogin', async (req, res) => {
  const response = await getLanguageOptions(req.models, req.headers['if-none-match']);
  if (response === 304) {
    res.status(304).end();
    return;
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', response.eTag);
  res.send(response.languageOptions);
});
