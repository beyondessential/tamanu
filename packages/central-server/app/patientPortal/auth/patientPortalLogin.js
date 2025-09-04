import asyncHandler from 'express-async-handler';
import config from 'config';
import { z } from 'zod';

import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/shared/errors';

import { buildToken, getRandomU32 } from '../../auth/utils';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';

const getOneTimeTokenEmail = ({ email, token }) => {
  return {
    to: email,
    from: config.mailgun.from,
    subject: 'Your login code',
    text: `Your 6-digit login code is: ${token}`,
    html: `<p>Your 6-digit login code is: <strong>${token}</strong></p>`,
  };
};

const requestLoginSchema = z.object({
  email: z.email(),
});

export const requestLoginToken = asyncHandler(async (req, res) => {
  const { store, body, emailService } = req;
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

  // Create one-time token using the service
  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  const { token } = await oneTimeTokenService.createLoginToken(portalUser.id);

  // Send email with the 6-digit code
  const oneTimeTokenEmail = getOneTimeTokenEmail({ email, token });
  const emailResult = await emailService.sendEmail(oneTimeTokenEmail);

  if (emailResult.status === COMMUNICATION_STATUSES.ERROR) {
    throw new Error('Failed to send email');
  }

  return res.status(200).json({
    message: 'One-time token sent successfully',
  });
});

export const patientPortalLogin = ({ secret }) =>
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { canonicalHostName } = config;
    const { models } = store;
    const { loginToken, email } = body;

    const portalUser = await models.PortalUser.getForAuthByEmail(email);
    const oneTimeTokenService = new PortalOneTimeTokenService(models);
    await oneTimeTokenService.verifyAndConsume({
      token: loginToken,
      // If the email is unknown, pass undefined so the service throws a generic auth error.
      portalUserId: portalUser?.id,
    });

    const { auth } = config;
    const { tokenDuration } = auth;

    const accessTokenJwtId = getRandomU32();

    const token = await buildToken({ portalUserId: portalUser.id }, secret, {
      expiresIn: tokenDuration,
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: canonicalHostName,
      jwtid: accessTokenJwtId.toString(),
    });

    return res.status(200).json({ token });
  });
