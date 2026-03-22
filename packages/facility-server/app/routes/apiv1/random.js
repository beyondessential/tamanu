import { NotFoundError } from '@tamanu/shared/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';

const WHITELISTED_ENTITIES = {
  patient: 'Patient',
  facility: 'Facility',
  location: 'Location',
  locationGroup: 'LocationGroup',
  program: 'Program',
  programRegistry: 'ProgramRegistry',
  department: 'Department',
};

export const random = express.Router();

random.get(
  '/:entity',
  asyncHandler(async (req, res) => {
    const { entity } = req.params;
    const modelName = WHITELISTED_ENTITIES[entity];

    if (!modelName) {
      throw new NotFoundError('Invalid entity');
    }

    req.checkPermission('read', modelName);

    const { models, facilityId } = req;

    const where =
      facilityId && models[modelName].rawAttributes.facilityId ? { facilityId } : {};

    const count = await models[modelName].count({ where });
    if (count === 0) {
      throw new NotFoundError('No record found');
    }

    const offset = Math.floor(Math.random() * count);
    const record = await models[modelName].findOne({ where, offset });

    res.send(record);
  }),
);
