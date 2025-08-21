import asyncHandler from 'express-async-handler';
import config from 'config';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { buildToken, getRandomU32 } from '../../auth/utils';
import { OneTimeTokenService } from './OneTimeTokenService';

const getOneTimeTokenEmail = ({ email, token }) => {
  return {
    to: email,
    from: config.email.from,
    subject: 'Your login code',
    text: `Your 6-digit login code is: ${token}`,
    html: `<p>Your 6-digit login code is: <strong>${token}</strong></p>`,
  };
};

export const sendOneTimeToken = () =>
  asyncHandler(async (req, res) => {
    const { store, body, emailService } = req;
    const { models } = store;
    const { email } = body;

    // Validate that the portal user exists
    const portalUser = await models.PortalUser.getForAuthByEmail(email);

    if (!portalUser) {
      throw new BadAuthenticationError('Invalid email address');
    }

    // Create one-time token using the service
    const oneTimeTokenService = new OneTimeTokenService(models);
    const token = await oneTimeTokenService.createForPortalUser(portalUser.id);

    // Send email with the 6-digit code
    const oneTimeTokenEmail = getOneTimeTokenEmail({ email, token });
    const emailResult = await emailService.sendEmail(oneTimeTokenEmail);

    if (emailResult.status === 'ERROR') {
      throw new Error('Failed to send email');
    }

    // Respond with the 6-digit code
    return res.status(200).json({
      message: 'One-time token sent successfully',
      code: token,
    });
  });

export const patientPortalLogin = ({ secret }) =>
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { canonicalHostName } = config;
    const { models } = store;
    const { email, code } = body;

    const portalUser = await models.PortalUser.getForAuthByEmail(email);

    if (!portalUser) {
      throw new BadAuthenticationError('Invalid email or password');
    }

    const oneTimeTokenService = new OneTimeTokenService(models);
    await oneTimeTokenService.verifyAndConsume({
      portalUserId: portalUser.id,
      token: code,
    });

    const { auth } = config;
    const { tokenDuration } = auth;

    const accessTokenJwtId = getRandomU32();

    const token = await buildToken({ portalUserId: portalUser.id }, secret, {
      expiresIn: tokenDuration,
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: canonicalHostName,
      jwtid: accessTokenJwtId,
    });

    return res.status(200).json({ token });
  });
