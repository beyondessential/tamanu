import config from 'config';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { JWT_TOKEN_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { BadAuthenticationError } from '@tamanu/shared/errors';

import {
  getRandomBase64String,
  getRandomU32,
  getToken,
  isInternalClient,
  verifyToken,
} from './utils';

export const refresh = ({ secret, refreshSecret }) =>
  asyncHandler(async (req, res) => {
    const { body, store } = req;
    const { refreshToken, deviceId } = body;

    const { canonicalHostName, auth } = config;
    const {
      tokenDuration,
      saltRounds,
      refreshToken: { refreshIdLength, tokenDuration: refreshTokenDuration, absoluteExpiration },
    } = auth;

    if (!isInternalClient(req.header('X-Tamanu-Client'))) {
      throw new BadAuthenticationError('Invalid client');
    }

    let contents = null;
    try {
      contents = await verifyToken(refreshToken, refreshSecret, {
        audience: JWT_TOKEN_TYPES.REFRESH,
        issuer: canonicalHostName,
      });
    } catch (e) {
      throw new BadAuthenticationError('Invalid token (jMbP)');
    }

    const { userId, refreshId } = contents;

    const user = await store.models.User.findOne({
      where: { id: userId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    if (!user) {
      throw new BadAuthenticationError('Invalid token (vN3y)');
    }

    const dbEntry = await store.models.RefreshToken.findOne({
      where: {
        userId,
        deviceId,
      },
    });

    if (!dbEntry) {
      throw new BadAuthenticationError('Invalid token (J7GC)');
    }

    if (dbEntry.expiresAt < new Date()) {
      throw new BadAuthenticationError('Refresh token expired');
    }

    const refreshIdValid = await bcrypt.compare(refreshId, dbEntry.refreshId);

    if (!refreshIdValid) {
      throw new BadAuthenticationError('Invalid token (Xh01)');
    }

    // issue new access token
    const accessTokenJwtId = getRandomU32();
    const token = await getToken(
      {
        userId: user.id,
        deviceId,
      },
      secret,
      {
        expiresIn: tokenDuration,
        audience: JWT_TOKEN_TYPES.ACCESS,
        issuer: canonicalHostName,
        jwtid: `${accessTokenJwtId}`,
      },
    );

    // rotate refresh token
    const newRefreshId = await getRandomBase64String(refreshIdLength);
    const refreshTokenJwtId = getRandomU32();
    const hashedRefreshId = await bcrypt.hash(newRefreshId, saltRounds);

    const newRefreshToken = await getToken(
      {
        userId: user.id,
        refreshId: newRefreshId,
        // If absolute expiration pass through the exp from the old token
        ...(absoluteExpiration && { exp: contents.exp }),
      },
      refreshSecret,
      {
        audience: JWT_TOKEN_TYPES.REFRESH,
        issuer: canonicalHostName,
        jwtid: `${refreshTokenJwtId}`,
        ...(!absoluteExpiration && { expiresIn: refreshTokenDuration }),
      },
    );
    // Extract expiry as set by jwt.sign
    const { exp } = jwt.decode(newRefreshToken);

    await store.models.RefreshToken.upsert(
      {
        refreshId: hashedRefreshId,
        userId: user.id,
        deviceId,
        expiresAt: absoluteExpiration ? dbEntry.expiresAt : new Date(exp * 1000),
      },
      {
        where: {
          userId: user.id,
          deviceId,
        },
      },
    );

    res.send({
      token,
      refreshToken: newRefreshToken,
    });
  });
