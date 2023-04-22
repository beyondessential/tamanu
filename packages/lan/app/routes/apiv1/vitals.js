import express from 'express';

import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const vitals = express.Router();

vitals.get('/:id', simpleGet('Vitals'));
vitals.put('/:id', simplePut('Vitals'));
vitals.post('/$', simplePost('Vitals'));
