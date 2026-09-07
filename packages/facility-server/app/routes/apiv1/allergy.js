import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const allergy = express.Router();

allergy.get('/:id', simpleGet('PatientAllergy', { auditAccess: true }));
allergy.put(
  '/:id',
  simplePut('PatientAllergy', {
    allowedFields: ['allergyId', 'note', 'practitionerId', 'reactionId', 'recordedDate'],
  }),
);
allergy.post(
  '/',
  simplePost('PatientAllergy', {
    allowedFields: [
      'allergyId',
      'id',
      'note',
      'patientId',
      'practitionerId',
      'reactionId',
      'recordedDate',
    ],
  }),
);
