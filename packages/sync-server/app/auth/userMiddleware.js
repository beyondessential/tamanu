import asyncHandler from 'express-async-handler';
import config from 'config';

import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import { verifyToken, stripUser } from './utils';

const FAKE_TOKEN = 'fake-token';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

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

    if (config.auth.allowDummyToken && token === FAKE_TOKEN) {
      req.user = await store.findUser(config.auth.initialUser.email);
      next();
      return;
    }

    let contents = null;
    try {
      contents = verifyToken(token, secret);
    } catch (e) {
      throw new BadAuthenticationError('Invalid token');
    }

    const { userId } = contents;

    const user = await store.findUserById(userId);

    if (!user) {
      throw new BadAuthenticationError(`User specified in token (${userId}) does not exist`);
    }

    req.user = stripUser(user);

    next();
  });

export const userInfo = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ForbiddenError();
  }

  res.send(req.user);
});
