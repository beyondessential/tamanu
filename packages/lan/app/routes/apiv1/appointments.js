import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfDay } from 'date-fns';
import { Op } from 'sequelize';
import { simplePost, simplePut } from './crudHelpers';

export const appointments = express.Router();

appointments.post('/$', simplePost('Appointment'));

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

    const associations = Appointment.getListReferenceAssociations(models);

    const afterTime = after || startOfDay(new Date());
    const startTimeQuery = {
      [Op.gte]: afterTime,
    };

    if (before) {
      startTimeQuery[Op.lte] = before;
    }
    const filters = Object.entries(queries).reduce(
      (_filters, [query, queryValue]) => ({
        ..._filters,
        [query]: {
          [Op.like]: `%${queryValue}%`,
        },
      }),
      {},
    );
    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[orderBy, order]],
      where: {
        startTime: startTimeQuery,
        ...filters,
      },
      include: [...associations],
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));
