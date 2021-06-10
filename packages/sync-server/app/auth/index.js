import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import config from 'config';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

import { ForbiddenError, BadAuthenticationError } from 'shared/errors';

import { getLocalisation } from '../localisation';
import { convertFromDbRecord, convertToDbRecord } from '../convertDbRecord';

import { changePassword } from './changePassword';
import { resetPassword } from './resetPassword';

export const authModule = express.Router();

export const getToken = async (user, expiry) => {
  return jwt.sign({ userId: user.id }, JWT_SECRET);
};

const JWT_SECRET = config.auth.secret || uuid();
const FAKE_TOKEN = 'fake-token';

const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

authModule.use('/resetPassword', resetPassword);
authModule.use('/changePassword', changePassword);

authModule.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { email, password } = body;

    if (!email && !password) {
      if (!config.auth.allowDummyToken) {
        throw new BadAuthenticationError('Missing credentials');
      }

      // send a token for the initial user
      const initialUser = await store.findUser(config.auth.initialUser.email);
      if (!initialUser) {
        throw new BadAuthenticationError('No such user');
      }
      res.send({
        token: FAKE_TOKEN,
        user: convertFromDbRecord(stripUser(initialUser)).data,
      });
      return;
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

    const token = await getToken(user);
    const localisation = await getLocalisation();

    // TODO: supports versions desktop-1.2.0/mobile-1.2.14 and older, remove once we no longer support these
    const featureFlags = {
      patientFieldOverrides: {
        displayId: {
          shortLabel: 'NHN',
          longLabel: 'National Health Number',
          hidden: false,
        },
      },
    };

    res.send({
      token,
      featureFlags,
      localisation,
      user: convertFromDbRecord(stripUser(user)).data,
    });
  }),
);

authModule.use(
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

    if (config.auth.allowDummyToken && token === FAKE_TOKEN) {
      req.user = await store.findUser(config.auth.initialUser.email);
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

authModule.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);

// TODO: remove this hack once we've verified nothing needs to upsert new or existing users
authModule.post(
  '/upsertUser',
  asyncHandler(async (req, res) => {
    const requestedAt = Date.now();
    const { store, body } = req;
    await store.upsert('user', convertToDbRecord(body));
    res.send({ count: 1, requestedAt });
  }),
);
