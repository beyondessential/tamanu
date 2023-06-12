import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const locationGroup = express.Router();

locationGroup.get('/:id', simpleGet('LocationGroup'));
locationGroup.put('/:id', simplePut('LocationGroup'));
locationGroup.post('/$', simplePost('LocationGroup'));
locationGroup.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }
    const locationGroups = await req.models.LocationGroup.findAll({
      where: {
        facilityId: config.serverFacilityId,
      },
    });
    res.send(locationGroups);
  }),
);

locationGroup.get(
  '/:id/locations',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }
    const locations = await req.models.Location.findAll({
      where: {
        facilityId: config.serverFacilityId,
        locationGroupId: req.params.id,
      },
    });
    res.send(locations);
  }),
);
