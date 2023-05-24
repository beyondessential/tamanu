import express from 'express';

import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const diagnosis = express.Router();

diagnosis.get('/:id', simpleGet('EncounterDiagnosis'));
diagnosis.put('/:id', simplePut('EncounterDiagnosis'));
diagnosis.post('/$', simplePost('EncounterDiagnosis'));
