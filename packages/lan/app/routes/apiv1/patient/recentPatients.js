import express from 'express';
import asyncHandler from 'express-async-handler';
import { renameObjectKeys } from '../../../utils/renameObjectKeys';

const recentPatientsRoute = express.Router();

recentPatientsRoute.get(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { RecentPatients },
      user,
    } = req;
    req.flagPermissionChecked();

    const recentPatientList = await RecentPatients.getForUser(user.id);
    const forResponse = recentPatientList.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
    });
  }),
);

export { recentPatientsRoute as recentPatients };
