import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

export const locationAssignments = express.Router();

locationAssignments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkListOrReadPermission('LocationAssignment');

    const {
      models: { LocationAssignment, User, Location },
      query: {
        facilityId,
        locationId,
        clinicianId,
        after,
        before,
        rowsPerPage = 10,
        page = 0,
        all = false,
        order = 'ASC',
        orderBy = 'date',
      },
    } = req;

    const whereClause = {};

    if (facilityId) {
      whereClause['$location.facility_id$'] = facilityId;
    }

    if (locationId) {
      const locationIds = Array.isArray(locationId) ? locationId : [locationId];
      whereClause.locationId = { [Op.in]: locationIds };
    }

    if (clinicianId) {
      const clinicianIds = Array.isArray(clinicianId) ? clinicianId : [clinicianId];
      whereClause.userId = { [Op.in]: clinicianIds };
    }

    if (after) {
      whereClause.date = { ...whereClause.date, [Op.gte]: after };
    }
    if (before) {
      whereClause.date = { ...whereClause.date, [Op.lte]: before };
    }

    const includeOptions = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      },
      {
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'facilityId'],
      },
    ];

    const { rows, count } = await LocationAssignment.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[orderBy, order]],
    });

    res.send({
      count,
      data: rows,
    });
  }),
);
