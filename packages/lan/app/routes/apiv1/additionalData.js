import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const additionalData = express.Router();

additionalData.get('/:id', simpleGet('PatientAdditionalData'));
additionalData.put('/:id', simplePut('PatientAdditionalData'));
additionalData.post('/$', simplePost('PatientAdditionalData'));
