import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const changePassword = express.Router();

changePassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    // no permission needed
    req.flagPermissionChecked();

    const { models, deviceId } = req;

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.forwardRequest(req, 'changePassword');

    // If central server successful, update password on facility server too
    await updatePasswordOnFacilityServer(models, req.body);

    res.send(response);
  }),
);

const updatePasswordOnFacilityServer = async (models, { email, newPassword }) => {
  await models.User.update(
    {
      password: newPassword,
    },
    { where: { email } },
  );
};
