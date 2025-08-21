import asyncHandler from 'express-async-handler';
import config from 'config';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { buildToken, getRandomU32 } from '../../auth/utils';

// TODO: Note that this has NO authentication ATM - it just exists for patient portal MVP
export const patientPortalLogin = ({ secret }) => {
  return asyncHandler(async (req, res) => {
    const { store, body } = req;

    const { canonicalHostName } = config;

    const { models } = store;

    const { email } = body;

    const portalUser = await models.PortalUser.getForAuthByEmail(email);

    if (!portalUser) {
      throw new BadAuthenticationError('Invalid email or password');
    }

    const { auth } = config;
    const { tokenDuration } = auth;

    const accessTokenJwtId = getRandomU32();

    const token = await buildToken({ portalUserId: portalUser.id }, secret, {
      expiresIn: tokenDuration,
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: canonicalHostName,
      jwtid: `${accessTokenJwtId}`,
    });

    return res.status(200).json({ token });
  });
};
