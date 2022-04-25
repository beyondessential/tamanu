import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfDay } from 'date-fns';
import { Op } from 'sequelize';
import config from 'config';
import { simplePost, simplePut } from './crudHelpers';
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
  'patient.first_name',
  'patient.last_name',
  'patient.display_id',
];

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

      let searchOperator = Op.iLike;
      if (config.db.sqlitePath) {
        searchOperator = Op.like;
      }

      return {
        ..._filters,
        [column]: {
          [searchOperator]: `%${escapePatternWildcard(queryValue)}%`,
        },
      };
    }, {});
    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[orderBy, order]],
      where: {
        startTime: startTimeQuery,
        ...filters,
      },
      include: [...Appointment.getListReferenceAssociations()],
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));
