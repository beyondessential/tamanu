import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const allergy = express.Router();

allergy.get('/:id', simpleGet('PatientAllergy'));
allergy.put('/:id', simplePut('PatientAllergy'));
allergy.post('/$', simplePost('PatientAllergy'));
