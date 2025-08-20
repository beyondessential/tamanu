import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Op } from 'sequelize';

export const locationRouter = express.Router();

locationRouter.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    const {
      models: { LocationGroup },
      query: { bookableOnly = false, locationGroupIds },
    } = req;
    const { facilityId } = req.query;

    const filter = {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      ...(facilityId ? { facilityId } : {}),
    };

    const locations = await req.models.Location.findAll({
      where: filter,
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
      ],
      order: [
        ['locationGroup', 'name', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    res.send(locations);
  }),
);
