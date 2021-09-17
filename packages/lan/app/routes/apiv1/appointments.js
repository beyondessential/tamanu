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

appointments.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Appointment');
    const appointment = await req.models.Appointment.findByPk(req.params.id);
    if (!appointment) {
      throw new NotFoundError();
    }
    req.checkPermission('write', 'Appointment');
    await appointment.update({
      ...req.body,
    });
    res.send(appointment);
  }),
);
