import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants/auth';
import { SERVER_TYPES } from '@tamanu/constants/servers';
import { log } from '@tamanu/shared/services/logging';
import { BadAuthenticationError } from '@tamanu/errors';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { initAuditActions } from '@tamanu/database/utils/audit';

import { version } from '../../serverInfo';
import { verifyToken } from '../../auth/utils';
import { PATIENT_PORTAL_COOKIE_NAME } from './login';

export const patientPortalMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers, cookies } = req;

    const { canonicalHostName } = config;

    // Prefer httpOnly cookie (not readable by JS); fall back to Authorization header
    let token = cookies?.[PATIENT_PORTAL_COOKIE_NAME];
    if (!token && headers.authorization) {
      const [bearer, authToken] = headers.authorization.split(/\s/);
      if (bearer?.toLowerCase() === 'bearer') {
        token = authToken;
      }
    }
    if (!token) {
      throw new BadAuthenticationError('No authorization header or session cookie provided');
    }

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

    const { portalUserId } = contents.payload;

    const portalUser = await store.models.PortalUser.findByPk(portalUserId);
    if (!portalUser) {
      throw new BadAuthenticationError(
        `Portal user specified in token (${portalUserId}) does not exist`,
      );
    }

    const patient = await portalUser.getPatient({ include: ['additionalData'] });

    if (!patient) {
      throw new BadAuthenticationError(
        `Portal user specified in token (${portalUserId}) does not have a patient`,
      );
    }

    // Transform additionalData from array to object
    if (patient.additionalData && Array.isArray(patient.additionalData)) {
      patient.setDataValue('additionalData', patient.additionalData[0] || null);
    }

    /* eslint-disable require-atomic-updates */
    req.portalUser = portalUser;
    req.patient = patient;
    req.sessionId = sessionId;
    /* eslint-enable require-atomic-updates */

    const isAuditEnabled = await req.settings.get('audit.accesses.enabled');
    // Attach auditing helper similar to standard user middleware
    // eslint-disable-next-line require-atomic-updates
    req.audit = initAuditActions(req, {
      enabled: isAuditEnabled,
      userId: SYSTEM_USER_UUID,
      version,
      backEndContext: { serverType: SERVER_TYPES.CENTRAL, isPatientPortal: true },
    });

    /**
     * Stub out permission checks to always return true. Permission checks are not needed or supported
     * in patient portal but these methods are called in shared code such as suggesters
     */
    req.checkPermission = () => true;
    req.ability = {
      can: () => true,
    };

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
