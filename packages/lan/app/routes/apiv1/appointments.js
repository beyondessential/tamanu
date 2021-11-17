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
      query: { after, before, rowsPerPage = 10, page = 0 },
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
    const { rows, count } = await Appointment.findAndCountAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      order: [['startTime', 'ASC']],
      where: {
        startTime: startTimeQuery,
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
