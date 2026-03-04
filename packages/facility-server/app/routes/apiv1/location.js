import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES, LOCATION_BOOKABLE_VIEW } from '@tamanu/constants';
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
      query: { isBookable, locationGroupIds },
    } = req;
    const { facilityId } = req.query;

    const bookableWhereClause = [
      LOCATION_BOOKABLE_VIEW.DAILY,
      LOCATION_BOOKABLE_VIEW.WEEKLY,
    ].includes(isBookable)
      ? {
          isBookable: {
            [Op.in]: [LOCATION_BOOKABLE_VIEW.ALL, isBookable],
          },
        }
      : null;

    const locations = await req.models.Location.findAll({
      where: {
        facilityId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      include: [
        {
          required: true,
          model: LocationGroup,
          as: 'locationGroup',
          where: {
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
            ...bookableWhereClause,
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
