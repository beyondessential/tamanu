import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const location = express.Router();

const locationLookup = async (req, whereClause = {}) => {
  req.checkPermission('list', 'Location');
  if (!config.serverFacilityId) {
    return [];
  }
  return req.models.Location.findall({
    where: { facilityId: config.serverFacilityId, ...whereClause },
  });
};

location.get('/:id', simpleGet('Location'));
location.put('/:id', simplePut('Location'));
location.post('/$', simplePost('Location'));
location.get(
  '/$',
  asyncHandler(async (req, res) => {
    const localisation = req.getLocalisation();
    const locations = await locationLookup(req);
    // parentLocationId will always be a column in the db, but we only want to expose it if the feature is enabled
    if (!localisation?.features.locationHierarchy) {
      res.send(locations.map(({ parentLocationId, ...rest }) => rest));
    }
    res.send(locations);
  }),
);

// These routes are specific to the location heirarchy feature
// We assume they'll only be requested from the front end if the feature is enabled
location.get(
  '/:id/children',
  asyncHandler(async (req, res) => {
    const locations = await locationLookup(req, {
      // Return the parent location along side all its children so the parent info will be available to the frontend
      [Op.or]: [{ id: req.params.id }, { parentLocationId: req.params.id }],
    });
    res.send(locations);
  }),
);

location.get(
  '/roots',
  asyncHandler(async (req, res) => {
    // A location without a parent is assumed to be a root
    const locations = locationLookup(req, { parentLocationId: null });
    res.send(locations);
  }),
);
