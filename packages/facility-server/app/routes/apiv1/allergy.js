import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const allergy = express.Router();

const EDITABLE_FIELDS = ['allergyId', 'note', 'practitionerId', 'reactionId', 'recordedDate'];

allergy.get('/:id', simpleGet('PatientAllergy', { auditAccess: true }));
allergy.put('/:id', simplePut('PatientAllergy', { allowedFields: EDITABLE_FIELDS }));
allergy.post(
  '/',
  simplePost('PatientAllergy', { allowedFields: [...EDITABLE_FIELDS, 'id', 'patientId'] }),
);
