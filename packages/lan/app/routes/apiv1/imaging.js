import express from 'express';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const imagingRequest = express.Router();

imagingRequest.get('/:id', simpleGet('ImagingRequest'));
imagingRequest.put('/:id', simplePut('ImagingRequest'));
imagingRequest.post('/$', simplePost('ImagingRequest'));

const encounterRelations = permissionCheckingRouter('read', 'ImagingRequest');
encounterRelations.get('/:id/imagingType', simpleGetList('imagingType', 'encounterId'));
