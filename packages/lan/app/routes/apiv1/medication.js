import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const medication = express.Router();

medication.get('/:id', simpleGet('EncounterMedication'));
medication.put('/:id', simplePut('EncounterMedication'));
medication.post('/$', simplePost('EncounterMedication'));
