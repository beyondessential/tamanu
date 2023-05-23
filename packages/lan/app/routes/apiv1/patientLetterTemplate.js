import express from 'express';

import { simpleGet } from './crudHelpers';

export const patientLetterTemplate = express.Router();

patientLetterTemplate.get('/:id', simpleGet('PatientLetterTemplate'));
