import express from 'express';
import asyncHandler from 'express-async-handler';

import { getPermissions } from '@tamanu/shared/permissions/middleware';

import { convertFromDbRecord } from '../convertDbRecord';
import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';
import { login } from './login';
import { refresh } from './refresh';
import { setFacility } from './setFacility';
import { userInfo, userMiddleware } from './userMiddleware';

const passthrough = (_req, _res, next) => next();

// Exported as a factory so that the central createApi can inject a shared
// rate-limiter instance. The unauthenticated / pre-auth endpoints below
// (login, refresh, password reset) do expensive work (bcrypt, DB lookups)
// and must be rate-limited to mitigate brute-force / DoS attacks.
export const authModule = ({ authLimiter } = {}) => {
  const limiter = authLimiter ?? passthrough;
  const router = express.Router();

  router.use('/resetPassword', limiter, resetPassword);
  router.use('/changePassword', limiter, changePassword);
  router.post('/login', limiter, login);
  router.post('/refresh', limiter, refresh);

  router.use(userMiddleware);
  router.post('/setFacility', limiter, setFacility);
  router.get('/user/me', userInfo);

  router.get('/permissions', asyncHandler(getPermissions));
  router.get(
    '/whoami',
    asyncHandler((req, res) => {
      res.send(convertFromDbRecord(req.user).data);
    }),
  );

  return router;
};
