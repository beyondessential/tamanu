import asyncHandler from 'express-async-handler';
import config from 'config';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { buildToken, getRandomU32 } from '../../auth/utils';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';

const getOneTimeTokenEmail = async ({ email, token, settings }) => {
  const template = await settings.get('templates.patientPortalLoginEmail');
  console.log('template', template);
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

export const requestLoginToken = asyncHandler(async (req, res) => {
  const { store, body, emailService, settings } = req;
  const { models } = store;
  const { email } = body;

  // Validate that the portal user exists
  const portalUser = await models.PortalUser.getForAuthByEmail(email);

  if (!portalUser) {
    throw new BadAuthenticationError('Invalid email address');
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
      portalUserId: portalUser.id,
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
