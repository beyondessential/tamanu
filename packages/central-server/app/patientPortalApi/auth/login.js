import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import {
  COMMUNICATION_STATUSES,
  PORTAL_ONE_TIME_TOKEN_TYPES,
  PORTAL_USER_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/errors';

import { buildToken } from '../../auth/utils';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { getDefaultFromAddress } from '../../services/mailConfig';
import { getCanonicalHostName } from '@tamanu/shared/utils';

const getOneTimeTokenEmail = async ({ email, token, settings }) => {
  const template = await settings.get('templates.patientPortalLoginEmail');
  const templateData = {
    token,
  };

  const subject = replaceInTemplate(template.subject, templateData);
  const content = replaceInTemplate(template.body, templateData);

  return {
    to: email,
    from: await getDefaultFromAddress(settings),
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

  const portalUsers = await models.PortalUser.getLivingByEmail(email);

  if (portalUsers.length === 0) {
    log.debug('Patient portal login: no living patient for email - suppressing issuing token', {
      email,
    });
    // Avoid email enumeration by always returning a success response for invalid email addresses
    return res.status(200).json({
      message: 'One-time token sent successfully',
    });
  }

  const portalUser = portalUsers.find(({ status }) => status === PORTAL_USER_STATUSES.REGISTERED);
  if (!portalUser) {
    throw new BadAuthenticationError('Email is not verified');
  }

  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  const { token } = await oneTimeTokenService.createLoginToken(
    portalUser.id,
    await settings.get('patientPortal.loginTokenDurationMinutes'),
  );

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
    const { store, body, settings } = req;
    const canonicalHostName = getCanonicalHostName();
    const { models } = store;
    const { loginToken, email } = body;

    const portalUsers = await models.PortalUser.getLivingByEmail(email);
    // The code was issued against one of the email's portal users; an unknown email or one with
    // only deceased patients finds none, so the service throws a generic auth error.
    const issuedToken = await models.PortalOneTimeToken.findOne({
      where: {
        type: PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN,
        portalUserId: portalUsers.map(({ id }) => id),
      },
      order: [['createdAt', 'DESC']],
    });

    const oneTimeTokenService = new PortalOneTimeTokenService(models);
    const portalUser = await oneTimeTokenService.verifyAndConsume({
      token: loginToken,
      portalUserId: issuedToken?.portalUserId,
    });

    const patientPortalTokenDuration = await settings.get('patientPortal.tokenDuration');

    const token = await buildToken(
      { portalUserId: portalUser.id, email: portalUser.email },
      secret,
      {
        expiresIn: patientPortalTokenDuration,
        audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
        issuer: canonicalHostName,
      },
    );

    return res.status(200).json({ token });
  });
