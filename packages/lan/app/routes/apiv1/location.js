import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const location = express.Router();

location.get('/:id', simpleGet('Location'));
location.put('/:id', simplePut('Location'));
location.post('/$', simplePost('Location'));
location.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }
    const locations = await req.models.Location.findAll({
      where: {
        facilityId: config.serverFacilityId,
      },
    });
    res.send(locations);
  }),
);
