import express from 'express';

import { checkPermission } from 'lan/app/controllers/auth/permission';
import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const visit = express.Router();

visit.get('/:id', checkPermission('getVisit'), simpleGet('Visit'));
visit.put('/:id', checkPermission('updateVisit'), simplePut('Visit'));
visit.post('/$', checkPermission('createVisit'), simplePost('Visit'));

visit.get('/:id/vitals', checkPermission('getVisit'), simpleGetList('Vitals', 'visitId'));
