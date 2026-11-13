import asyncHandler from 'express-async-handler';

import { PORTAL_USER_STATUSES } from '@tamanu/constants';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { NotFoundError } from '@tamanu/errors';
import { PortalProfilesSchema } from '@tamanu/shared/schemas/patientPortal';
import { getCanonicalHostName } from '@tamanu/shared/utils';

import { buildToken } from '../../auth/utils';

const getRegisteredPortalUsers = async (models, email) => {
  const portalUsers = await models.PortalUser.getLivingByEmail(email);
  return portalUsers.filter(({ status }) => status === PORTAL_USER_STATUSES.REGISTERED);
};

export const getProfiles = asyncHandler(async (req, res) => {
  const email = req.portalSessionEmail;
  const portalUsers = await getRegisteredPortalUsers(req.store.models, email);
  for (const { patient } of portalUsers) {
    await req.audit.access({ recordId: patient.id, model: req.models.Patient });
  }

  res.send(
    PortalProfilesSchema.parse({
      email,
      data: portalUsers.map(({ id, patient }) => ({ ...patient.forResponse(), portalUserId: id })),
    }),
  );
});

export const selectProfile = ({ secret }) =>
  asyncHandler(async (req, res) => {
    const email = req.portalSessionEmail;
    const portalUsers = await getRegisteredPortalUsers(req.store.models, email);
    const selectedPortalUser = portalUsers.find(({ id }) => id === req.params.portalUserId);
    if (!selectedPortalUser) {
      throw new NotFoundError('Profile not found');
    }
    await req.audit.access({ recordId: selectedPortalUser.patientId, model: req.models.Patient });

    // Keeps the signed-in session's expiry, so switching profile cannot extend it
    const token = await buildToken({ portalUserId: selectedPortalUser.id, email }, secret, {
      expiresIn: req.portalSessionExpiresAt,
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: getCanonicalHostName(),
    });

    res.send({ token });
  });
