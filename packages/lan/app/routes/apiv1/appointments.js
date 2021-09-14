import express from 'express';
import { simplePost, simpleGetList } from './crudHelpers';

export const appointments = express.Router();

appointments.post('/$', simplePost('Appointment'));

appointments.get('/$', simpleGetList('Appointment'));
