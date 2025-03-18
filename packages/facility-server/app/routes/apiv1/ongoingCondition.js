import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const ongoingCondition = express.Router();

ongoingCondition.get('/:id', simpleGet('PatientCondition', { auditAccess: true }));
ongoingCondition.put('/:id', simplePut('PatientCondition'));
ongoingCondition.post('/$', simplePost('PatientCondition'));
