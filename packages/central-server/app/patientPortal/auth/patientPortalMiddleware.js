import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants/auth';
import { log } from '@tamanu/shared/services/logging';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { addAuditUtilToRequest } from '@tamanu/database/utils/audit';

import { version } from '../../package.json';
import { findPortalUserById } from './utils';
import { verifyToken } from '../../auth/utils';

export const patientPortalMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    const { canonicalHostName } = config;

    const { authorization } = headers;
    if (!authorization) {
      throw new BadAuthenticationError('No authorization header provided');
    }

    const [bearer, token] = authorization.split(/\s/);
    const sessionId = createSessionIdentifier(token);

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadAuthenticationError('Only Bearer token is supported');
    }

    let contents = null;
    try {
      contents = await verifyToken(token, secret, {
        issuer: canonicalHostName,
        audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      });
    } catch (e) {
      log.debug('Patient portal auth error: Invalid token', { error: e.message });
      res.status(401).send({
        error: { message: 'Invalid token' },
      });
      return;
    }

    const { portalUserId } = contents;

    const portalUser = await findPortalUserById(store.models, portalUserId);
    if (!portalUser) {
      throw new BadAuthenticationError(
        `Portal user specified in token (${portalUserId}) does not exist`,
      );
    }

    const patient = await portalUser.getPatient();

    if (!patient) {
      throw new BadAuthenticationError(
        `Portal user specified in token (${portalUserId}) does not have a patient`,
      );
    }

    /* eslint-disable require-atomic-updates */
    req.portalUser = portalUser;
    req.patient = patient;
    req.sessionId = sessionId;
    /* eslint-enable require-atomic-updates */

    const auditSettings = await store.models.Setting.get('audit');
    // Attach auditing helper similar to standard user middleware
    // eslint-disable-next-line require-atomic-updates
    req.audit = addAuditUtilToRequest(req, {
      enabled: auditSettings?.accesses.enabled,
      userId: SYSTEM_USER_UUID,
      portalUserId,
      sessionId,
      version,
    });

    const spanAttributes = {
      'app.patient.id': patient.id,
    };

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes(spanAttributes);
    context.with(
      propagation.setBaggage(context.active(), propagation.createBaggage(spanAttributes)),
      () => next(),
    );
  });
