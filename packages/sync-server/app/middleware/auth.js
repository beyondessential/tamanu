import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import config from 'config';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

import { ForbiddenError, BadAuthenticationError } from 'shared/errors';

import { convertFromDbRecord } from '../convertDbRecord';

export const authMiddleware = express.Router();

const JWT_SECRET = config.auth.secret || uuid();
const FAKE_TOKEN = 'fake-token';

const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

authMiddleware.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { email, password } = body;

    if(config.auth.dummyUserEmail) {
      if(!email && !password) {
        // send a token for the dummy user
        const dummy = await store.findUser(config.auth.dummyUserEmail);
        if(!dummy) {
          throw new BadAuthenticationError('No such user');
        }
        res.send({
          token: FAKE_TOKEN,
          user: convertFromDbRecord(stripUser(dummy)).data,
        });
        return;
      }
    }

    if (!email || !password) {
      throw new BadAuthenticationError('Missing credentials');
    }

    const user = await store.findUser(email);

    if (!user && config.auth.reportNoUserError) {
      // an attacker can use this to get a list of user accounts
      // but hiding this error entirely can make debugging a hassle
      // so we just put it behind a config flag
      throw new BadAuthenticationError('No such user');
    }

    const hashedPassword = user?.password || '';

    if (!(await bcrypt.compare(password, hashedPassword))) {
      throw new BadAuthenticationError('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.send({ token, user: convertFromDbRecord(stripUser(user)).data });
  }),
);

authMiddleware.use(
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      throw new ForbiddenError();
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadAuthenticationError('Only Bearer token is supported');
    }

    if (config.auth.dummyUserEmail && token === FAKE_TOKEN) {
      req.user = await await store.findUser(config.auth.dummyUserEmail);
      next();
      return;
    }

    let contents = null;
    try {
      contents = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      throw new BadAuthenticationError('Invalid token');
    }

    const { userId } = contents;

    const user = await store.findUserById(userId);

    if (!user) {
      throw new BadAuthenticationError(`User specified in token (${userId}) does not exist`);
    }

    req.user = stripUser(user);

    next();
  }),
);

authMiddleware.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);
