import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const location = express.Router();

location.get('/:id', simpleGet('Location'));
location.put('/:id', simplePut('Location'));
location.post('/$', simplePost('Location'));
location.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    const { facilityId } = req.query;
    const locations = await req.models.Location.findAll({
      where: {
        facilityId,
      },
    });
    res.send(locations);
  }),
);
