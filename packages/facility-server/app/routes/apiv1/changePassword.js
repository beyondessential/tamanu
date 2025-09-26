import express from 'express';
import asyncHandler from 'express-async-handler';
import { Sequelize } from 'sequelize';

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

changePassword.post(
  '/validate-reset-code',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const { deviceId } = req;

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.forwardRequest(req, 'changePassword/validate-reset-code');

    res.send(response);
  }),
);

const updatePasswordOnFacilityServer = async (models, { email, newPassword }) => {
  const user = await models.User.scope('withPassword').findOne({
    where: Sequelize.where(
      Sequelize.fn('lower', Sequelize.col('email')),
      Sequelize.fn('lower', email),
    ),
  });

  if (user) {
    // Set password directly - the beforeUpdate hook will handle hashing
    user.password = newPassword;
    await user.save();
  }
};
