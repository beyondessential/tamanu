import express from 'express';

import { simpleGet } from 'shared/crudHelpers';

export const patientLetterTemplate = express.Router();

patientLetterTemplate.get('/:id', simpleGet('PatientLetterTemplate'));
