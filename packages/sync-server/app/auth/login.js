import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';

import { BadAuthenticationError } from 'shared/errors';
import { getToken, stripUser } from './utils';

export const login = asyncHandler(async (req, res) => {
  const { store, body } = req;
  const { email, password, facilityId } = body;

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

  const token = getToken(user, config.auth.tokenDuration);

  // Send some additional data with login to tell the user about
  // the context they've just logged in to.
  const facility = await store.models.Facility.findByPk(facilityId);
  const localisation = await getLocalisation();

  res.send({
    token,
    user: convertFromDbRecord(stripUser(user)).data,
    facility,
    localisation,
  });
});
