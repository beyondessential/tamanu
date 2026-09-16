import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const patientIssue = express.Router();

const EDITABLE_FIELDS = ['note', 'recordedDate', 'type'];

patientIssue.get('/:id', simpleGet('PatientIssue'));
patientIssue.put('/:id', simplePut('PatientIssue', { allowedFields: EDITABLE_FIELDS }));
patientIssue.post(
  '/',
  simplePost('PatientIssue', { allowedFields: [...EDITABLE_FIELDS, 'id', 'patientId'] }),
);
