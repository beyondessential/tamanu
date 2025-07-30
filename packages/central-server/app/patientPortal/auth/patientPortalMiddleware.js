import { context, propagation, trace } from '@opentelemetry/api';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { log } from '@tamanu/shared/services/logging';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { verifyToken } from '../../auth/utils';
import { findPatientUserById } from './utils';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';

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

    const { patientUserId } = contents;

    const patientUser = await findPatientUserById(store.models, patientUserId);
    if (!patientUser) {
      throw new BadAuthenticationError(
        `Patient user specified in token (${patientUserId}) does not exist`,
      );
    }

    const patient = await patientUser.getPatient();

    if (!patient) {
      throw new BadAuthenticationError(
        `Patient user specified in token (${patientUserId}) does not have a patient`,
      );
    }

    /* eslint-disable require-atomic-updates */
    req.patientUser = patientUser;
    req.patient = patient;
    req.sessionId = sessionId;
    /* eslint-enable require-atomic-updates */

    const spanAttributes = {
      'app.patient.id': patient.id,
      'app.patient.role': patientUser.role,
    };

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes(spanAttributes);
    context.with(
      propagation.setBaggage(context.active(), propagation.createBaggage(spanAttributes)),
      () => next(),
    );
  });
