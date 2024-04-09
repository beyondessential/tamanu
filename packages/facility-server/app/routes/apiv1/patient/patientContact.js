import express from 'express';
import { simpleGetList, simplePost } from '@tamanu/shared/utils/crudHelpers';

export const patientContact = express.Router();

patientContact.get('/:id/reminderContacts', simpleGetList('PatientContact', 'patientId'));

patientContact.post('/reminderContact', simplePost('PatientContact'));
