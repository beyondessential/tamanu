import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const familyHistory = express.Router();

familyHistory.get('/:id', simpleGet('PatientFamilyHistory', { auditAccess: true }));
familyHistory.put(
  '/:id',
  simplePut('PatientFamilyHistory', {
    allowedFields: ['diagnosisId', 'note', 'practitionerId', 'recordedDate', 'relationship'],
  }),
);
familyHistory.post(
  '/',
  simplePost('PatientFamilyHistory', {
    allowedFields: [
      'diagnosisId',
      'id',
      'note',
      'patientId',
      'practitionerId',
      'recordedDate',
      'relationship',
    ],
  }),
);
