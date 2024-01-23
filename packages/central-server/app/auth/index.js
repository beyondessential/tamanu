import config from 'config';
import crypto from 'crypto';
import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { getLanguageOptions } from '@tamanu/shared/utils/translation/getLanguageOptions';
import { NOT_MODIFIED_STATUS_CODE } from '@tamanu/constants';

import { getPermissions } from '@tamanu/shared/permissions/middleware';

import { convertFromDbRecord } from '../convertDbRecord';
import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';
import { refresh } from './refresh';
import { userInfo, userMiddleware } from './userMiddleware';

export const DEFAULT_JWT_SECRET = config.auth.secret || crypto.randomUUID();
export const DEFAULT_JWT_REFRESH_SECRET = config.auth.refreshToken.secret || crypto.randomUUID();

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
  if (response === NOT_MODIFIED_STATUS_CODE) {
    res.status(NOT_MODIFIED_STATUS_CODE).end();
    return;
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', response.eTag);
  res.send(response.languageOptions);
});
