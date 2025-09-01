import asyncHandler from 'express-async-handler';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { PORTAL_ONE_TIME_TOKEN_TYPES, PORTAL_USER_STATUSES } from '@tamanu/constants';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';

function parseRegistrationToken(token) {
  if (typeof token !== 'string') {
    throw new BadAuthenticationError('Invalid registration token');
  }

  // Check if token contains exactly one full stop
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new BadAuthenticationError('Invalid registration token');
  }

  return parts;
}

export const verifyRegistration = asyncHandler(async (req, res) => {
  const { store, params } = req;
  const { models } = store;
  const { token } = params;

  if (!token) {
    throw new BadAuthenticationError('No registration token provided');
  }
  const [portalUserId, oneTimeToken] = parseRegistrationToken(token);

  const portalUser = await models.PortalUser.findByPk(portalUserId);
  if (!portalUser) {
    throw new BadAuthenticationError('Invalid registration token');
  }
  if (portalUser.status === PORTAL_USER_STATUSES.REGISTERED) {
    throw new BadAuthenticationError('User already registered');
  }

  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  await oneTimeTokenService.verifyAndConsume({
    portalUserId,
    token: oneTimeToken,
    type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
  });

  await models.PortalUser.update({ status: PORTAL_USER_STATUSES.REGISTERED }, { id: portalUserId });

  return res.status(200).json({
    message: 'User registered successfully',
  });
});
