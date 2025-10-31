import express from 'express';
import asyncHandler from 'express-async-handler';

import { getPermissions } from '@tamanu/shared/permissions/middleware';

import { convertFromDbRecord } from '../convertDbRecord';
import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';
import { refresh } from './refresh';
import { userInfo, userMiddleware } from './userMiddleware';

export const authModule = express.Router();

authModule.use('/resetPassword', resetPassword);
authModule.use('/changePassword', changePassword);
authModule.post('/login', login);
authModule.post('/refresh', refresh);

authModule.use(userMiddleware);
authModule.get('/user/me', userInfo);

authModule.get('/permissions', asyncHandler(getPermissions));
authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);
