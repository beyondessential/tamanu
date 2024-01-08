import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const patientIssue = express.Router();

patientIssue.get('/:id', simpleGet('PatientIssue'));
patientIssue.put('/:id', simplePut('PatientIssue'));
patientIssue.post('/$', simplePost('PatientIssue'));
