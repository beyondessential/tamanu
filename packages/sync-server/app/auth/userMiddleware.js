import { trace, propagation, context } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import { verifyToken, stripUser, findUserById } from './utils';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;
    const { canonicalHostName } = config;

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

    let contents = null;
    try {
      contents = await verifyToken(token, secret, {
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

    const spanAttributes = req.user
      ? {
          'app.user.id': req.user.id,
          'app.user.role': req.user.role,
        }
      : {};

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes(spanAttributes);
    context.with(
      propagation.setBaggage(context.active(), propagation.createBaggage(spanAttributes)),
      () => next(),
    );
  });

export const userInfo = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ForbiddenError();
  }

  res.send(req.user);
});
