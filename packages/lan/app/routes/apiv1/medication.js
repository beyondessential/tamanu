import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const medication = express.Router();

medication.get('/:id', simpleGet('VisitMedication'));
medication.put('/:id', simplePut('VisitMedication'));
medication.post('/$', simplePost('VisitMedication'));
