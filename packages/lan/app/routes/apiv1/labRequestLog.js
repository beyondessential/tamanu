import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const labRequestLog = express.Router();

labRequestLog.get('/:id', simpleGet('LabRequestLog'));
labRequestLog.put('/:id', simplePut('LabRequestLog'));
labRequestLog.post('/$', simplePost('LabRequestLog'));

labRequestLog.get('/:labRequestId', simpleGet('LabRequestLog'));
