import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfDay } from 'date-fns';
import { Op, Sequelize } from 'sequelize';
import { simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import { escapePatternWildcard } from '../../utils/query';

export const appointments = express.Router();

appointments.post('/$', simplePost('Appointment'));

const searchableFields = [
  'startTime',
  'endTime',
  'type',
  'status',
  'clinicianId',
  'locationId',
  'locationGroupId',
  'patient.first_name',
  'patient.last_name',
  'patient.display_id',
];

const sortKeys = {
  patientName: Sequelize.fn(
    'concat',
    Sequelize.col('patient.first_name'),
    ' ',
    Sequelize.col('patient.last_name'),
  ),
  displayId: Sequelize.col('patient.display_id'),
  sex: Sequelize.col('patient.sex'),
  dateOfBirth: Sequelize.col('patient.date_of_birth'),
  location: Sequelize.col('location.name'),
  locationGroup: Sequelize.col('location_groups.name'),
  clinician: Sequelize.col('clinician.display_name'),
};

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Appointment');
    const {
      models,
      query: {
        after,
        before,
        rowsPerPage = 10,
        page = 0,
        all = false,
        order = 'ASC',
        orderBy = 'startTime',
        ...queries
      },
    } = req;
    const { Appointment } = models;

    const afterTime = after || startOfDay(new Date());
    const startTimeQuery = {
      [Op.gte]: afterTime,
    };

    if (before) {
      startTimeQuery[Op.lte] = before;
    }
    const filters = Object.entries(queries).reduce((_filters, [queryField, queryValue]) => {
      if (!searchableFields.includes(queryField)) {
        return _filters;
      }
      if (!(typeof queryValue === 'string')) {
        return _filters;
      }
      let column = queryField;
      // querying on a joined table (associations)
      if (queryField.includes('.')) {
        column = `$${queryField}$`;
      }

      return {
        ..._filters,
        [column]: {
          [Op.iLike]: `%${escapePatternWildcard(queryValue)}%`,
        },
      };
    }, {});
    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[sortKeys[orderBy] || orderBy, order]],
      where: {
        startTime: startTimeQuery,
        ...filters,
      },
      include: [...Appointment.getListReferenceAssociations()],
    });

    // Backwards compatibility for appointments created before locationHierarchy was implemented
    const backwardsCompatibleRows = rows.map(data => {
      const { location, locationGroup, ...rest } = data.get({ plain: true });
      return {
        ...rest,
        locationGroup: locationGroup || location,
      };
    });

    res.send({
      count,
      data: backwardsCompatibleRows,
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));
