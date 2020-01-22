import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from 'Lan/app/errors';
import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const user = express.Router();

user.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError();
    }
    res.send(req.user);
  }),
);

user.get('/:id', simpleGet('User'));
user.put('/:id', simplePut('User'));
user.post('/$', simplePost('User'));
