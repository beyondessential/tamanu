import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const user = express.Router();

user.get('/:id', simpleGet('User'));
user.put('/:id', simplePut('User'));
user.post('/$', simplePost('User'));
