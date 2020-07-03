import express from 'express';
import asyncHandler from 'express-async-handler';

import { REFERENCE_TYPES } from 'shared/constants';
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

labTest.get('/options$', asyncHandler(async (req, res) => {
  // always allow reading lab test options
  req.flagPermissionChecked();

  const records = await req.models.LabTestType.findAll();
  res.send({
    data: records,
    count: records.length,
  });
}));

labTest.get('/categories$', asyncHandler(async (req, res) => {
  // always allow reading lab test options
  req.flagPermissionChecked();

  const records = await req.models.ReferenceData.findAll({
    where: { type: REFERENCE_TYPES.LAB_TEST_CATEGORY },
  });

  res.send({
    data: records,
    count: records.length,
  });
}));

labTest.put('/:id', simplePut('LabTest'));


