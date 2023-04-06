import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from 'shared/constants/auth';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import { verifyToken, stripUser, findUser, findUserById } from './utils';

const FAKE_TOKEN = 'fake-token';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    const { canonicalHostName, auth } = config;
    const { allowDummyToken } = auth;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      throw new ForbiddenError();
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadAuthenticationError('Only Bearer token is supported');
    }

    if (allowDummyToken && token === FAKE_TOKEN) {
      req.user = await findUser(store.models, config.auth.initialUser.email);
      next();
      return;
    }

    let contents = null;
    try {
      contents = verifyToken(token, secret, {
        issuer: canonicalHostName,
        audience: JWT_TOKEN_TYPES.ACCESS,
      });
    } catch (e) {
      throw new BadAuthenticationError('Invalid token');
    }

    const { userId, deviceId } = contents;

    const user = await findUserById(store.models, userId);

    if (!user) {
      throw new BadAuthenticationError(`User specified in token (${userId}) does not exist`);
    }

    req.user = stripUser(user);
    req.deviceId = deviceId;

    next();
  });

export const userInfo = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ForbiddenError();
  }

  res.send(req.user);
});
