import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';

import { BadAuthenticationError } from 'shared/errors';
import { FAKE_TOKEN, getToken, stripUser } from './utils';

export const login = asyncHandler(async (req, res) => {
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

  res.send({
    token,
    localisation,
    user: convertFromDbRecord(stripUser(user)).data,
  });
});
