import express from 'express';
import asyncHandler from 'express-async-handler';

import { getPermissions } from '@tamanu/shared/permissions/middleware';

import { convertFromDbRecord } from '../convertDbRecord';
import { changePassword } from './changePassword';
import { enrolInvite } from './enrolInvite';
import { resetPassword } from './resetPassword';
import { passwordlessLogin } from './passwordlessLogin';
import { login } from './login';
import { mfa } from './mfa';
import { mfaLogin } from './mfaLogin';
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
  // pre-auth: authorised by invite token + password, then a scoped JWT —
  // registered before the userMiddleware-gated /mfa router takes the rest of
  // that path space
  router.use('/mfa/enrolInvite', limiter, enrolInvite);
  // pre-auth: authorised by the short-lived mfa_login token from /login
  router.use('/mfa/login', limiter, mfaLogin);
  router.post('/login', limiter, login);
  // pre-auth: a user-verifying passkey assertion IS the credential
  router.use('/login/webauthn', limiter, passwordlessLogin);
  router.post('/refresh', limiter, refresh);

  router.use(userMiddleware);
  router.post('/setFacility', setFacility);
  router.get('/user/me', userInfo);
  router.use('/mfa', mfa);

  router.get('/permissions', asyncHandler(getPermissions));
  router.get(
    '/whoami',
    asyncHandler((req, res) => {
      res.send(convertFromDbRecord(req.user).data);
    }),
  );

  return router;
};
