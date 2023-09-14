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

    const centralServer = new CentralServerConnection({ deviceId }, await req.settings.get('sync'));
    const response = await centralServer.forwardRequest(req, 'changePassword');

    // If sync server successful, update password on lan server too
    await updatePasswordOnLanServer(models, req.body);

    res.send(response);
  }),
);

const updatePasswordOnLanServer = async (models, { email, newPassword }) => {
  await models.User.update(
    {
      password: newPassword,
    },
    { where: { email } },
  );
};
