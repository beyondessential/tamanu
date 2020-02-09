import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const diagnosis = express.Router();

diagnosis.get('/:id', simpleGet('VisitDiagnosis'));
diagnosis.put('/:id', simplePut('VisitDiagnosis'));
diagnosis.post('/$', simplePost('VisitDiagnosis'));
