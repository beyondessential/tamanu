import express from 'express';
import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';

export const patientContact = express.Router();

patientContact.get('/:id/reminderContacts', simpleGetList('PatientContact', 'patientId'));
