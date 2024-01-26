import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const familyHistory = express.Router();

familyHistory.get('/:id', simpleGet('PatientFamilyHistory'));
familyHistory.put('/:id', simplePut('PatientFamilyHistory'));
familyHistory.post('/$', simplePost('PatientFamilyHistory'));
