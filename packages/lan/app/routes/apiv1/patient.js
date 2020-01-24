import express from 'express';

import { checkPermission } from 'Lan/app/controllers/auth/permission';
import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', checkPermission('viewPatientDetails'), simpleGet('Patient'));
patient.put('/:id', checkPermission('updatePatientDetails'), simplePut('Patient'));
patient.post('/$', checkPermission('createPatient'), simplePost('Patient'));

patient.get(
  '/:id/visits',
  checkPermission('getPatientVisits'),
  simpleGetList('Visit', 'patientId'),
);
