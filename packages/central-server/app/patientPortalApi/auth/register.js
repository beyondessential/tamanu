import asyncHandler from 'express-async-handler';
import { BadAuthenticationError } from '@tamanu/errors';
import { z } from 'zod';
import { PORTAL_ONE_TIME_TOKEN_TYPES, PORTAL_USER_STATUSES } from '@tamanu/constants';
import { PortalOneTimeTokenService } from './PortalOneTimeTokenService';

const RegistrationTokenSchema = z.string().refine(token => token.split('.').length === 2, {
  message: 'Token must contain exactly one period',
});

function parseRegistrationToken(token) {
  try {
    // Validate token format
    RegistrationTokenSchema.parse(token);

    // Split into parts after validation
    return token.split('.');
  } catch (error) {
    throw new BadAuthenticationError('Invalid registration token');
  }
}

export const register = asyncHandler(async (req, res) => {
  const { store, body } = req;
  const { models } = store;
  const { token } = body;

  if (!token) {
    throw new BadAuthenticationError('No registration token provided');
  }
  const [portalUserId, oneTimeToken] = parseRegistrationToken(token);

  const portalUser = await models.PortalUser.findByPk(portalUserId);
  if (!portalUser) {
    throw new BadAuthenticationError('Invalid registration token');
  }

  // If the user is already registered and verified,
  // don't continue verifying the token
  if (portalUser.status === PORTAL_USER_STATUSES.REGISTERED) {
    return res.status(200).json({
      message: 'User already registered',
    });
  }

  await store.sequelize.transaction(async () => {
    const oneTimeTokenService = new PortalOneTimeTokenService(models);
    await oneTimeTokenService.verifyAndConsume({
      portalUserId,
      token: oneTimeToken,
      type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
    });

    await models.PortalUser.update(
      { status: PORTAL_USER_STATUSES.REGISTERED },
      {
        where: { id: portalUserId },
      },
    );
  });

  return res.status(200).json({
    message: 'User registered successfully',
  });
});
