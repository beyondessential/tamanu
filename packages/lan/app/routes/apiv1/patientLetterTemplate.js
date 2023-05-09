import express from 'express';

import { simpleGet, simpleGetList } from './crudHelpers';

export const patientLetterTemplate = express.Router();

patientLetterTemplate.get('/:id', simpleGet('PatientLetterTemplate'));
