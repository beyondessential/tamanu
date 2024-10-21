import config from 'config';
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
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }

    const {
      models: { Location, LocationGroup },
      query: {
        includeLocationGroup = false,
        bookableOnly = false, // No effect if includeLocationGroup is falsy
      },
    } = req;

    const options = {
      where: {
        facilityId: config.serverFacilityId,
      },
    };

    if (includeLocationGroup) {
      options.include = [
        {
          required: true,
          model: LocationGroup,
          as: 'locationGroup',
          ...(bookableOnly ? { where: { isBookable: true } } : null),
        },
      ];
      options.order = [
        ['locationGroup', 'name', 'ASC'],
        ['name', 'ASC'],
      ];
    }

    const locations = await Location.findAll(options);
    res.send(locations);
  }),
);
