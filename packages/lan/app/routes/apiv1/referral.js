import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post('/$', simplePost('Referral'));
