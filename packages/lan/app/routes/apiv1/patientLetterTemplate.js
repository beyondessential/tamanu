import express from 'express';

import { simpleGet } from '@tamanu/shared/utils/crudHelpers';

export const patientLetterTemplate = express.Router();

patientLetterTemplate.get('/:id', simpleGet('PatientLetterTemplate'));
