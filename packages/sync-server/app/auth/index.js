import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import rateLimit from 'express-rate-limit';

import { convertFromDbRecord } from '../convertDbRecord';

import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';

import { userMiddleware } from './userMiddleware';

export const authModule = express.Router();

// don't allow too many calls against the account endpoints
const rateLimitOptions = {
  windowMs: config.auth.rateLimit.windowMinutes * 60 * 1000,
  max: config.auth.rateLimit.tries 
};
const limiter = rateLimit(rateLimitOptions);

authModule.use('/resetPassword', limiter, resetPassword);
authModule.use('/changePassword', limiter, changePassword);
authModule.post('/login', limiter, login);

authModule.use(userMiddleware);

authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);

