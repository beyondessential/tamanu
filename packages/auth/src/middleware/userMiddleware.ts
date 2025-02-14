import { Attributes, BaggageEntry, context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError, ForbiddenError } from '@tamanu/shared/errors';
import { findUserById, stripUser, verifyToken } from '../utils/utils';

// TODO: another look at types for this file

export const userMiddleware = ({ secret }: { secret: string }) =>
  asyncHandler(async (req: any, _, next) => {
    const { store, headers } = req;

    const { canonicalHostName } = config as any;

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
      throw new BadAuthenticationError('Invalid token (hG7c)');
    }

    const { userId, deviceId } = contents;

    const user = await findUserById(store.models, userId);
    if (!user) {
      throw new BadAuthenticationError(`User specified in token (${userId}) does not exist`);
    }

    /* eslint-disable require-atomic-updates */
    // in this case we don't care if we're overwriting the user/deviceId
    // and express also guarantees execution order for middlewares
    req.user = user;
    req.deviceId = deviceId;
    /* eslint-enable require-atomic-updates */

    const spanAttributes: Attributes = user
      ? {
          'app.user.id': user.id,
          'app.user.role': user.role,
        }
      : {};

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes(spanAttributes);
    context.with(
      propagation.setBaggage(
        context.active(),
        // TODO: weird and probably incorrect
        propagation.createBaggage(spanAttributes as unknown as Record<string, BaggageEntry>),
      ),
      () => next(),
    );
  });

export const userInfo = asyncHandler(async (req: any, res) => {
  if (!req.user) {
    throw new ForbiddenError();
  }

  res.send(stripUser(req.user));
});
