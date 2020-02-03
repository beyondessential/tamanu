import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

patient.get('/:id/visits', simpleGetList('Visit', 'patientId'));
