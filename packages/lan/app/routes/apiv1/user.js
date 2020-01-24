import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from 'lan/app/errors';
import { checkPermission } from 'lan/app/controllers/auth/permission';
import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const user = express.Router();

user.get(
  '/me',
  checkPermission(null), // a user can always access their own data
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError();
    }
    res.send(req.user);
  }),
);

user.get('/:id', checkPermission('getUserDetails'), simpleGet('User'));

user.put('/:id', checkPermission('updateUserDetails'), simplePut('User'));

user.post('/$', checkPermission('createUser'), simplePost('User'));
