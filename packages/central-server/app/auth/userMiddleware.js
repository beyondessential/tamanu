import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { log } from '@tamanu/shared/services/logging';
import { BadAuthenticationError, ForbiddenError } from '@tamanu/shared/errors';
import { findUserById, stripUser, verifyToken } from './utils';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { initAuditActions } from '@tamanu/database/utils/audit';

import { version } from '../../package.json';
import { SERVER_TYPES } from '@tamanu/constants';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers, settings } = req;

    const { canonicalHostName } = config;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      throw new ForbiddenError();
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    const sessionId = createSessionIdentifier(token);

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
      const errorMessage = 'Auth error: Invalid token (hG7c)';
      log.debug(errorMessage, { error: e.message });
      res.status(401).send({
        error: { message: errorMessage },
      });
      return;
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
    req.sessionId = sessionId;
    /* eslint-enable require-atomic-updates */

    const auditSettings = await settings?.[req.facilityId]?.get('audit');

    // Auditing middleware
    req.audit = initAuditActions(req, {
      enabled: auditSettings?.accesses.enabled,
      userId,
      version,
      backEndContext: { serverType: SERVER_TYPES.CENTRAL },
    });

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
