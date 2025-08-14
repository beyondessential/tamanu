import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Op } from 'sequelize';

export const locationsRouter = express.Router();

locationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    
    const {
      models: { LocationGroup, Facility },
      query: { bookableOnly = false, locationGroupIds, facilityId },
    } = req;

    const whereClause = {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      ...(facilityId && { facilityId }),
    };

    const locations = await req.models.Location.findAll({
      where: whereClause,
      include: [
        {
          required: true,
          model: LocationGroup,
          as: 'locationGroup',
          where: {
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
            ...(bookableOnly ? { isBookable: true } : null),
            ...(locationGroupIds ? { id: { [Op.in]: locationGroupIds } } : null),
          },
        },
        {
          model: Facility,
          as: 'facility',
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['facility', 'name', 'ASC'],
        ['locationGroup', 'name', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    
    res.send(locations);
  }),
);