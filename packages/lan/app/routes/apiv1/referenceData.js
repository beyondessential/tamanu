import express from 'express';

import { simplePut, simplePost } from './crudHelpers';

export const referenceData = express.Router();

referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));
