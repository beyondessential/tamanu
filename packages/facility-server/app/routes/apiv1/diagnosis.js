import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const diagnosis = express.Router();

diagnosis.get('/:id', simpleGet('EncounterDiagnosis', { auditAccess: true }));
diagnosis.put('/:id', simplePut('EncounterDiagnosis'));
diagnosis.post('/$', simplePost('EncounterDiagnosis'));
