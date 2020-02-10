import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const triage = express.Router();

triage.get('/:id', simpleGet('Triage'));
triage.put('/:id', simplePut('Triage'));
triage.post('/$', simplePost('Triage'));

