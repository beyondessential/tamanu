import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError } from 'shared/errors';
import { simpleGet, simplePut, paginatedGetList, simplePost, permissionCheckingRouter } from './crudHelpers';

export const user = express.Router();

user.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError();
    }
    req.checkPermission('read', req.user);
    res.send(req.user);
  }),
);

user.get('/:id', simpleGet('User'));
user.put('/:id', simplePut('User'));
user.post('/$', simplePost('User'));

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get('/$', paginatedGetList('User', ''));
user.use(globalUserRequests);
