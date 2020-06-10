import express from 'express';

import { 
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const labRequest = express.Router();

labRequest.get('/:id', simpleGet('LabRequest'));
labRequest.put('/:id', simplePut('LabRequest'));
labRequest.post('/$', simplePost('LabRequest'));

const labRelations = permissionCheckingRouter('read', 'LabRequest');
labRelations.get('/:id/tests', simpleGetList('LabTest', 'labRequestId'));
labRequest.use(labRelations);

export const labTest = express.Router();

labTest.put('/:id', simplePut('LabTest'));
