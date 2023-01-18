import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { getPermissionsForRoles } from 'shared/permissions/rolesToPermissions';
import { BadAuthenticationError } from 'shared/errors';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getToken, stripUser, findUser, getRandomBase64String } from './utils';

export const login = ({ secret, refreshSecret }) =>
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { email, password, facilityId, deviceId } = body;

    if (!email || !password) {
      throw new BadAuthenticationError('Missing credentials');
    }

    const user = await findUser(store.models, email);

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

    const {
      tokenDuration,
      saltRounds,
      refreshToken: { refreshIdLength, tokenDuration: refreshTokenDuration },
    } = config.auth;

    const token = getToken(user, secret, tokenDuration);

    const refreshId = await getRandomBase64String(refreshIdLength);

    const hashedRefreshId = await bcrypt.hash(refreshId, saltRounds);

    const refreshToken = getToken(
      { userId: user.id, refreshId },
      refreshSecret,
      refreshTokenDuration,
    );

    // Extract expiry as set by jwt.sign
    const { exp } = jwt.decode(refreshToken);

    await store.models.RefreshToken.upsert(
      {
        refreshId: hashedRefreshId,
        expiresAt: exp,
        userId: user.id,
        deviceId,
      },
      {
        where: {
          userId: user.id,
          deviceId,
        },
      },
    );

    // Send some additional data with login to tell the user about
    // the context they've just logged in to.
    const [facility, localisation, permissions] = await Promise.all([
      store.models.Facility.findByPk(facilityId),
      getLocalisation(),
      getPermissionsForRoles(user.role),
    ]);

    res.send({
      token,
      refreshToken,
      user: convertFromDbRecord(stripUser(user)).data,
      permissions,
      facility,
      localisation,
      centralHost: config.canonicalHostName,
    });
  });
