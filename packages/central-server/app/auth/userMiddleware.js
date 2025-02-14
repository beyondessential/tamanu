import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { ForbiddenError } from '@tamanu/shared/errors';
import { findUserById, stripUser, verifyToken } from './utils';
import {log} from '@tamanu/shared/services/logging';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    const { canonicalHostName } = config;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      log.debug(`Auth error: No Authorization header`);
      return res.status(403).json()
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    if (bearer.toLowerCase() !== 'bearer') {
      log.debug(`Auth error: Only Bearer token is supported`);
      return res.status(401).json();
    }

    let contents = null;
    try {
      contents = await verifyToken(token, secret, {
        issuer: canonicalHostName,
        audience: JWT_TOKEN_TYPES.ACCESS,
      });
    } catch (e) {
      log.debug(`Auth error: Failed to verify token`, { error: e.message });
      return res.status(401).json();
    }


    const { userId, deviceId } = contents;

    const user = await findUserById(store.models, userId);
    if (!user) {
      log.debug(`Auth error: User not found`, { userId });
      return res.status(401).json();
    }

    /* eslint-disable require-atomic-updates */
    // in this case we don't care if we're overwriting the user/deviceId
    // and express also guarantees execution order for middlewares
    req.user = user;
    req.deviceId = deviceId;
    /* eslint-enable require-atomic-updates */

    const spanAttributes = user
      ? {
          'app.user.id': user.id,
          'app.user.role': user.role,
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

  res.send(stripUser(req.user));
});
