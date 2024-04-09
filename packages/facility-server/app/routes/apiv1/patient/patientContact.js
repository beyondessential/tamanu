import express from 'express';
import { simpleGetList, simplePost } from '@tamanu/shared/utils/crudHelpers';

export const patientContact = express.Router();

patientContact.get('/:id/reminderContacts', simpleGetList('PatientContact', 'patientId'));

patientContact.post('/:id/reminderContact', simplePost('PatientContact'));
