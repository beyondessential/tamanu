import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import { AuthPermissionError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';

export const setFacility = asyncHandler(async (req, res) => {
  const {
    store: { models },
    body,
    user,
  } = req;

  const { facilityId } = await z.object({ facilityId: z.string() }).parseAsync(body);

  const userInstance = await models.User.findByPk(user.id);
  const hasAccess = await userInstance.canAccessFacility(facilityId);
  if (!hasAccess) {
    throw new AuthPermissionError('User does not have access to this facility');
  }

  const facilitySettings = new ReadSettings(models, facilityId);
  const settings = await facilitySettings.getFrontEndSettings();

  res.send({ settings });
});

