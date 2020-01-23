import express from 'express';

import { checkPermission } from 'lan/app/controllers/auth/permission';
import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const vitals = express.Router();

vitals.get('/:id', checkPermission('getVisit'), simpleGet('Vitals'));
vitals.put('/:id', checkPermission('updateVisit'), simplePut('Vitals'));
vitals.post('/$', checkPermission('updateVisit'), simplePost('Vitals'));
