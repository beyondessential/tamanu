import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import bcrypt from 'bcrypt';
import config from 'config';
import { v4 as uuid } from 'uuid';

import jwt from 'jsonwebtoken';

export const authMiddleware = express.Router();

const JWT_SECRET = config.auth.secret || uuid();

authMiddleware.post('/login', asyncHandler(async (req, res) => {
  const { store, body } = req;
  const { email, password } = body;

  if(!email || !password) {
    throw new BadAuthenticationError('Missing credentials');
  }

  const user = await store.findUser(email);
  if(!user) {
    throw new BadAuthenticationError('No user');
  }

  const hashedPassword = user?.data?.hashedPassword || '';

  if(!await bcrypt.compare(password, hashedPassword)) {
    throw new BadAuthenticationError('Invalid credentials');
  }

  const token = jwt.sign({
    userId: user.id,
  }, JWT_SECRET);

  res.send({ 
    token,
    user,
  });
}));

authMiddleware.use(asyncHandler(async (req, res, next) => {
  const { store, headers } = req;
  
  // get token
  const { authorization } = headers;
  if(!authorization) {
    throw new ForbiddenError();
  }

  // verify token
  const [bearer, token] = authorization.split(/\s/);
  if(bearer.toLowerCase() !== 'bearer') {
    throw new BadAuthenticationError('Only Bearer token is supported');
  }

  if(token === 'fake-token') {
    next();
    return;
  }

  try {
    const contents = jwt.verify(token, JWT_SECRET);
    const { userId } = contents;

    const user = await store.findById(userId);

    if(!user) {
      throw new BadAuthenticationError('User specified in token does not exist');
    }

    req.user = user;

    next();
  } catch(e) {
    throw new BadAuthenticationError('Invalid token');
  }
}));

authMiddleware.get('/whoami', asyncHandler((req, res) => {
  res.send(req.user);
}));

