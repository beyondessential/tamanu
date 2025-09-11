import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import {
  ForbiddenError,
  InvalidCredentialError,
  InvalidTokenError,
  MissingCredentialError,
} from '@tamanu/errors';
import { findUserById, stripUser, verifyToken } from './utils';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';

import { version } from '../../package.json';

export const userMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers, settings } = req;

    const { canonicalHostName } = config;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      throw new MissingCredentialError('Missing authorization header');
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    const sessionId = createSessionIdentifier(token);

    if (bearer.toLowerCase() !== 'bearer') {
      throw new InvalidCredentialError('Only Bearer token is supported');
    }

    let contents = null;
    try {
      contents = await verifyToken(token, secret, {
        issuer: canonicalHostName,
        audience: JWT_TOKEN_TYPES.ACCESS,
      });
    } catch (e) {
      throw new InvalidTokenError();
    }

    const { userId, deviceId } = contents;

    const user = await findUserById(store.models, userId);
    if (!user) {
      throw new InvalidTokenError('User specified in token does not exist').withExtraData({
        userId,
      });
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
    // eslint-disable-next-line require-atomic-updates
    req.audit = {
      access: async ({ recordId, params, model }) => {
        if (!auditSettings?.accesses.enabled) return;
        return req.models.AccessLog.create({
          userId,
          recordId,
          recordType: model.name,
          sessionId,
          isMobile: false,
          frontEndContext: params,
          backEndContext: { endpoint: req.originalUrl },
          loggedAt: new Date(),
          facilityId: null,
          deviceId: req.deviceId || 'unknown-device',
          version,
        });
      },
    };

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
