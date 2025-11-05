import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { ForbiddenError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { stripUser } from './utils';
import { initAuditActions } from '@tamanu/database/utils/audit';

import { version } from '../../package.json';
import { SERVER_TYPES } from '@tamanu/constants';

export const userMiddleware = asyncHandler(async (req, res, next) => {
  const {
    auth: { secret, tokenDuration },
    canonicalHostName,
  } = config;
  const {
    store: {
      models: { User },
    },
    settings,
  } = req;

  const { token, user, device } = await User.loginFromAuthorizationHeader(
    req.get('authorization'),
    { log, settings, tokenDuration, tokenIssuer: canonicalHostName, tokenSecret: secret },
  );
  const sessionId = createSessionIdentifier(token);

  /* eslint-disable require-atomic-updates */
  // in this case we don't care if we're overwriting the user/deviceId
  // and express also guarantees execution order for middlewares
  req.user = user;
  req.deviceId = device?.id;
  req.device = device;
  req.sessionId = sessionId;
  /* eslint-enable require-atomic-updates */

  const auditSettings = await settings?.[req.facilityId]?.get('audit');

    // Auditing middleware
    req.audit = initAuditActions(req, {
      enabled: auditSettings?.accesses.enabled,
      userId: user.id,
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
