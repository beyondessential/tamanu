import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const imagingRequest = express.Router();

imagingRequest.get('/:id', simpleGet('ImagingRequest'));
imagingRequest.put('/:id', simplePut('ImagingRequest'));
imagingRequest.post('/$', simplePost('ImagingRequest'));
