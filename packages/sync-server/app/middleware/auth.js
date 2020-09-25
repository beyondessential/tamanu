import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';

export const authMiddleware = express.Router();

authMiddleware.get('/login', asyncHandler(async (req, res) => {
  const { models, db, query } = req;
  const { username, password } = query;

  if(!username || !password) {
    throw new BadAuthenticationError('Invalid credentials');
  }

  res.send({ 
    token: `token-${username}`,
  });
}));

authMiddleware.use(asyncHandler((req, res, next) => {
  const { models, db, query } = req;
  const { token } = query;
  
  if(!token) {
    throw new ForbiddenError();
  }

  next();
}));
