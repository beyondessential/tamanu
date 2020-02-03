import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const vitals = express.Router();

vitals.get('/:id', simpleGet('Vitals'));
vitals.put('/:id', simplePut('Vitals'));
vitals.post('/$', simplePost('Vitals'));
