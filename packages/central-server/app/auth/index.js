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
// rate-limiter instance. Unauthenticated / pre-auth endpoints below (login,
// refresh, password reset) do expensive work (bcrypt, DB lookups) and use the
// strict `authLimiter`. `/setFacility` runs after `userMiddleware` (already
// authenticated); it relies on the global limiter only — the auth limiter
// would mostly affect failed responses when `skipSuccessfulRequests` is true.
export const authModule = ({ authLimiter } = {}) => {
  const limiter = authLimiter ?? passthrough;
  const router = express.Router();

  router.use('/resetPassword', limiter, resetPassword);
  router.use('/changePassword', limiter, changePassword);
  router.post('/login', limiter, login);
  router.post('/refresh', limiter, refresh);

  router.use(userMiddleware);
  router.post('/setFacility', setFacility);
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
