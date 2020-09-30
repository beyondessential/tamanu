import express from 'express';
import { ENCOUNTER_PATIENT } from '../../database/includes';

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

const globalImagingRequests = permissionCheckingRouter('list', 'ImagingRequest');
globalImagingRequests.get(
  '/$',
  simpleGetList('ImagingRequest', '', { include: [ENCOUNTER_PATIENT] }),
);
imagingRequest.use(globalImagingRequests);
