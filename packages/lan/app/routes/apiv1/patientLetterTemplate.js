import express from 'express';

import { simpleGet } from 'shared/utils/crudHelpers';

export const patientLetterTemplate = express.Router();

patientLetterTemplate.get('/:id', simpleGet('PatientLetterTemplate'));
