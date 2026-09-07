import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const diagnosis = express.Router();

diagnosis.get('/:id', simpleGet('EncounterDiagnosis', { auditAccess: true }));
diagnosis.put(
  '/:id',
  simplePut('EncounterDiagnosis', {
    allowedFields: ['certainty', 'clinicianId', 'date', 'diagnosisId', 'isPrimary'],
  }),
);
diagnosis.post(
  '/',
  simplePost('EncounterDiagnosis', {
    allowedFields: [
      'certainty',
      'clinicianId',
      'date',
      'diagnosisId',
      'encounterId',
      'id',
      'isPrimary',
    ],
  }),
);
