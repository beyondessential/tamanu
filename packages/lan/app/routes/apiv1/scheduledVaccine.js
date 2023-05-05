import express from 'express';
import asyncHandler from 'express-async-handler';

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
      visibilityStatus: 'current',
      ...(category && { category }),
    };
    const scheduledVaccines = await ScheduledVaccine.findAll({ where });
    const results = scheduledVaccines.map(sv => sv.dataValues);

    res.send(results);
  }),
);
