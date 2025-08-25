import { NotFoundError } from '@tamanu/shared/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';

const WHITELISTED_ENTITIES = {
  patient: 'Patient',
  user: 'User',
  facility: 'Facility',
  location: 'Location',
  locationGroup: 'LocationGroup',
  program: 'Program',
  programRegistry: 'ProgramRegistry',
};

const getModelName = entity => {
  return WHITELISTED_ENTITIES[entity];
};

export const random = express.Router();

// This endpoint is solely for testing purposes. It should not be accessible outside of test environments.
random.get(
  '/:entity',
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV !== 'test') {
      return res.status(404).send();
    }

    const { entity } = req.params;
    const modelName = getModelName(entity);

    if (!modelName) {
      throw new NotFoundError('Invalid entity');
    }

    req.checkPermission('read', modelName);

    const { models, db, facilityId } = req;

    let where = {};

    if (facilityId && models[modelName].rawAttributes.facilityId) {
      where.facilityId = facilityId;
    }

    const record = await models[modelName].findOne({
      where,
      order: [db.literal('RANDOM()')],
    });

    if (!record) {
      throw new NotFoundError('No record found');
    }

    res.send(record);
  }),
);
