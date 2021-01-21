import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const issue = express.Router();

issue.get('/:id', simpleGet('PatientIssue'));
issue.put('/:id', simplePut('PatientIssue'));
issue.post('/$', simplePost('PatientIssue'));
