import express from 'express';

import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const familyHistory = express.Router();

familyHistory.get('/:id', simpleGet('PatientFamilyHistory'));
familyHistory.put('/:id', simplePut('PatientFamilyHistory'));
familyHistory.post('/$', simplePost('PatientFamilyHistory'));
