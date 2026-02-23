import asyncHandler from 'express-async-handler';
import config from 'config';
import ms from 'ms';
import { z } from 'zod';

import { COMMUNICATION_STATUSES, PORTAL_USER_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/errors';

import { buildToken } from '../../auth/utils';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';

export const PATIENT_PORTAL_COOKIE_NAME = 'patientPortalApiToken';

const getOneTimeTokenEmail = async ({ email, token, settings }) => {
  const template = await settings.get('templates.patientPortalLoginEmail');
  const templateData = {
    token,
  };

  const subject = replaceInTemplate(template.subject, templateData);
  const content = replaceInTemplate(template.body, templateData);

  return {
    to: email,
    from: config.mailgun.from,
    subject,
    text: content,
  };
};

const requestLoginSchema = z.object({
  email: z.email(),
});

export const requestLoginToken = asyncHandler(async (req, res) => {
  const { store, body, emailService, settings } = req;
  const { models } = store;
  let email;
  try {
    const result = await requestLoginSchema.parseAsync(body);
    email = result.email;
  } catch (error) {
    throw new BadAuthenticationError('Invalid email address');
  }

  // Validate that the portal user exists
  const portalUser = await models.PortalUser.getForAuthByEmail(email);

  if (!portalUser) {
    log.debug('Patient portal login: Invalid email address', { email });
    // Avoid email enumeration by always returning a success response for invalid email addresses
    return res.status(200).json({
      message: 'One-time token sent successfully',
    });
  }

  // Do not issue login tokens for deceased patients
  const patient = await portalUser.getPatient();
  if (patient?.dateOfDeath) {
    log.debug('Patient portal login: Deceased patient - suppressing issuing token', {
      email,
      patientId: patient.id,
    });
    return res.status(200).json({
      message: 'One-time token sent successfully',
    });
  }

  if (portalUser.status !== PORTAL_USER_STATUSES.REGISTERED) {
    throw new BadAuthenticationError('Email is not verified');
  }

  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  const { token } = await oneTimeTokenService.createLoginToken(portalUser.id);

  // Send email with the 6-digit code
  const oneTimeTokenEmail = await getOneTimeTokenEmail({ email, token, settings });
  const emailResult = await emailService.sendEmail(oneTimeTokenEmail);

  if (emailResult.status === COMMUNICATION_STATUSES.ERROR) {
    throw new Error('Failed to send email');
  }

  return res.status(200).json({
    message: 'One-time token sent successfully',
  });
});

export const login = ({ secret }) =>
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { canonicalHostName } = config;
    const { models } = store;
    const { loginToken, email } = body;

    const portalUser = await models.PortalUser.getForAuthByEmail(email);
    const patient = await portalUser?.getPatient();

    let portalUserIdParam = portalUser?.id;
    if (!portalUser) {
      log.debug('Patient portal login: suppressing issuing token for unknown user', {
        email,
      });
      // If the email is unknown, pass undefined so the service throws a generic auth error.
      portalUserIdParam = undefined;
    } else if (patient?.dateOfDeath) {
      log.debug('Patient portal login: suppressing issuing token for deceased patient', {
        email,
        patientId: patient.id,
        portalUserId: portalUser.id,
      });
      // If the patient is deceased, pass undefined so the service throws a generic auth error.
      portalUserIdParam = undefined;
    }

    const oneTimeTokenService = new PortalOneTimeTokenService(models);
    await oneTimeTokenService.verifyAndConsume({
      token: loginToken,
      portalUserId: portalUserIdParam,
    });

    const patientPortalTokenDuration = config.patientPortal.tokenDuration;

    const token = await buildToken({ portalUserId: portalUser.id }, secret, {
      expiresIn: patientPortalTokenDuration,
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: canonicalHostName,
    });

    const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
    const maxAgeMs = ms(patientPortalTokenDuration);

    res.cookie(PATIENT_PORTAL_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: maxAgeMs,
      path: '/api/portal',
    });

    return res.status(200).json({});
  });

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(PATIENT_PORTAL_COOKIE_NAME, {
    httpOnly: true,
    path: '/api/portal',
    secure: req.secure || req.get('x-forwarded-proto') === 'https',
    sameSite: 'lax',
  });
  return res.status(200).json({});
});
