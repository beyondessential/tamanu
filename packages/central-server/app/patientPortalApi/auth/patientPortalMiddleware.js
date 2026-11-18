import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';

import { JWT_TOKEN_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants/auth';
import { SERVER_TYPES } from '@tamanu/constants/servers';
import { log } from '@tamanu/shared/services/logging';
import { BadAuthenticationError, ForbiddenError } from '@tamanu/errors';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { initAuditActions } from '@tamanu/database/utils/audit';
import { getSubjectName } from '@tamanu/shared/permissions/middleware';

import { version } from '../../serverInfo';
import { verifyToken } from '../../auth/utils';
import { getCanonicalHostName } from '@tamanu/shared/utils';

const PORTAL_PERMITTED_ACTIONS = ['read', 'list'];

// The records the suggesters on the portal's allow-list read
const PORTAL_READABLE_SUBJECTS = [
  'ReferenceData',
  'LabTestType',
  'LabTestPanel',
  'LocationGroup',
  'Department',
  'Facility',
  'Location',
];

export const isPermittedForPortal = (action, subject) =>
  PORTAL_PERMITTED_ACTIONS.includes(action) &&
  PORTAL_READABLE_SUBJECTS.includes(getSubjectName(subject));

export const patientPortalMiddleware = ({ secret }) =>
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    const canonicalHostName = getCanonicalHostName();

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
     * Portal users hold no role, but shared code such as the suggesters checks permissions, so
     * stand in for them with a grant of read actions on the records those lookups need.
     */
    req.checkPermission = (action, subject) => {
      if (!isPermittedForPortal(action, subject)) {
        throw new ForbiddenError();
      }
    };
    req.ability = {
      can: isPermittedForPortal,
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
