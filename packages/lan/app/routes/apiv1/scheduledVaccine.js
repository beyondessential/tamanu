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

    if (!category) {
      throw new InvalidParameterError('category is a required parameter');
    }

    const scheduledVaccines = await ScheduledVaccine.findAll({ 
      where: {
        category,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }
    });
    
    // TODO: this can be removed yeah? it should all be going through 
    // the model's toJSON stuff anyway
    const results = scheduledVaccines.map(sv => sv.dataValues);

    res.send(scheduledVaccines);
  }),
);
