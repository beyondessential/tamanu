import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from 'shared/constants';

export const scheduledVaccine = express.Router();

scheduledVaccine.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');
    const {
      models: { ScheduledVaccine },
      query: { category },
    } = req;

    const where = {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      ...(category && { category }),
    };
    const scheduledVaccines = await ScheduledVaccine.findAll({ where });
    const results = scheduledVaccines.map(sv => sv.dataValues);

    res.send(results);
  }),
);
