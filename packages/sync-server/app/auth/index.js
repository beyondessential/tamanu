import express from 'express';
import asyncHandler from 'express-async-handler';

import { getPermissions } from 'shared/permissions/middleware';
import { convertFromDbRecord } from '../convertDbRecord';

import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';

import { userMiddleware, userInfo } from './userMiddleware';

export const authModule = express.Router();

authModule.use('/resetPassword', resetPassword);
authModule.use('/changePassword', changePassword);
authModule.post('/login', login);

authModule.use(userMiddleware);
authModule.get('/user/me', userInfo);

authModule.get('/permissions', asyncHandler(getPermissions));
authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);
