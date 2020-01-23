import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from 'Lan/app/errors';
import { simpleGet, simplePut, simplePost } from './crudHelpers';
import { checkPermission } from 'Lan/app/controllers/auth/permission';

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

user.get(
  '/:id', 
  checkPermission("getUserDetails"),
  simpleGet('User')
);

user.put('/:id', 
  checkPermission("updateUserDetails"),
  simplePut('User')
);

user.post('/$',
  checkPermission("createUser"),
  simplePost('User')
);
