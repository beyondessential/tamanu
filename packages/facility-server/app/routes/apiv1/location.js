import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import { Op } from 'sequelize';

export const location = express.Router();

location.get('/:id', simpleGet('Location'));
location.put('/:id', simplePut('Location'));
location.post('/$', simplePost('Location'));
location.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    const {
      models: { LocationGroup },
      query: { bookableOnly = false, locationGroupIds },
    } = req;
    const { facilityId } = req.query;
    const locations = await req.models.Location.findAll({
      where: {
        facilityId,
      },
      include: [
        {
          required: true,
          model: LocationGroup,
          as: 'locationGroup',
          ...(bookableOnly ? { where: { isBookable: true } } : null),
          ...(locationGroupIds ? { where: { id: { [Op.in]: locationGroupIds } } } : null),
        },
      ],
      order: [
        ['locationGroup', 'name', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    res.send(locations);
  }),
);
