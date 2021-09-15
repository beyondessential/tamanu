import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';
import { simplePost, simpleGetList } from './crudHelpers';

export const appointments = express.Router();

appointments.post('/$', simplePost('Appointment'));

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Appointment');
    simpleGetList('Appointment')(req, res);
  }),
);

appointments.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');
    const appointmentToBeDeleted = await req.models.Appointment.findByPk(req.params.id);
    if (!appointmentToBeDeleted) {
      throw new NotFoundError();
    }
    await req.models.Appointment.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.send({});
  }),
);
