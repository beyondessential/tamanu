import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';
import { checkPermission } from 'Lan/app/controllers/auth/permission';

export const vitals = express.Router();

vitals.get('/:id', checkPermission("getVisit"), simpleGet('Vitals'));
vitals.put('/:id', checkPermission("updateVisit"), simplePut('Vitals'));
vitals.post('/$', checkPermission("updateVisit"), simplePost('Vitals'));
