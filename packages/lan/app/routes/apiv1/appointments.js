import express from 'express';
import asyncHandler from 'express-async-handler';
import { simplePost, simplePut, simpleGetList } from './crudHelpers';

export const appointments = express.Router();

appointments.post('/$', simplePost('Appointment'));

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('list', 'Appointment');
    simpleGetList('Appointment', '', {
      include: [
        { model: models.Patient, as: 'patient' },
        { model: models.User, as: 'clinician' },
        { model: models.Location, as: 'location' },
      ],
    })(req, res);
  }),
);

appointments.put('/:id', simplePut('Appointment'));
