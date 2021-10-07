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
      query: { before, after },
    } = req;
    const { Appointment } = models;

    const associations = Appointment.getListReferenceAssociations(models);

    const start = after || startOfDay(new Date());
    const startTimeQuery = {
      [Op.gte]: start,
    };

    if (before) {
      startTimeQuery[Op.lte] = before;
    }
    const data = await Appointment.findAll({
      order: [['startTime', 'ASC']],
      where: {
        startTime: startTimeQuery,
      },
      include: [...associations],
    });

    res.send({
      count: data.length,
      data,
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));
