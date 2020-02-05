import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const visit = express.Router();

visit.get('/:id', simpleGet('Visit'));
visit.put('/:id', simplePut('Visit'));
visit.post('/$', simplePost('Visit'));

visit.get('/:id/vitals', simpleGetList('Vitals', 'visitId'));
