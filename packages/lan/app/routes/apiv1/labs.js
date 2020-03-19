import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const labRequest = express.Router();

labRequest.get('/:id', simpleGet('LabRequest'));
labRequest.put('/:id', simplePut('LabRequest'));
labRequest.post('/$', simplePost('LabRequest'));

labRequest.get('/:id/tests', simpleGetList('LabTest', 'labRequestId'));

export const labTest = express.Router();

labTest.put('/:id', simplePut('LabTest'));
