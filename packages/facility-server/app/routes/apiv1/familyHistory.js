import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const familyHistory = express.Router();

const EDITABLE_FIELDS = ['diagnosisId', 'note', 'practitionerId', 'recordedDate', 'relationship'];

familyHistory.get('/:id', simpleGet('PatientFamilyHistory', { auditAccess: true }));
familyHistory.put('/:id', simplePut('PatientFamilyHistory', { allowedFields: EDITABLE_FIELDS }));
familyHistory.post(
  '/',
  simplePost('PatientFamilyHistory', { allowedFields: [...EDITABLE_FIELDS, 'id', 'patientId'] }),
);
