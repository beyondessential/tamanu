import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const diagnosis = express.Router();

const EDITABLE_FIELDS = ['certainty', 'clinicianId', 'date', 'diagnosisId', 'isPrimary'];

diagnosis.get('/:id', simpleGet('EncounterDiagnosis', { auditAccess: true }));
diagnosis.put('/:id', simplePut('EncounterDiagnosis', { allowedFields: EDITABLE_FIELDS }));
diagnosis.post(
  '/',
  simplePost('EncounterDiagnosis', { allowedFields: [...EDITABLE_FIELDS, 'encounterId', 'id'] }),
);
