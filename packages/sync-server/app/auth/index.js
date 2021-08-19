import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { convertFromDbRecord } from '../convertDbRecord';

import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';

import { userMiddleware } from './userMiddleware';

export const authModule = express.Router();

authModule.use('/resetPassword', resetPassword);
authModule.use('/changePassword', changePassword);
authModule.post('/login', login);

authModule.use(userMiddleware);

authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);

