import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from 'shared/errors';
import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const referenceData = express.Router();

referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));

