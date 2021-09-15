import express from 'express';
import asyncHandler from 'express-async-handler';
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
