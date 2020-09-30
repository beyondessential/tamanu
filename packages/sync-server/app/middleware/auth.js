import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';

export const authMiddleware = express.Router();

authMiddleware.get('/login', asyncHandler(async (req, res) => {
  const { store, query } = req;
  const { username, password } = query;

  if(!username || !password) {
    throw new BadAuthenticationError('Invalid credentials');
  }

  res.send({ 
    token: `token-${username}`,
  });
}));

authMiddleware.use(asyncHandler((req, res, next) => {
  const { store, headers } = req;
  const { authorization } = headers;
  
  if(!authorization) {
    throw new ForbiddenError();
  }

  next();
}));
