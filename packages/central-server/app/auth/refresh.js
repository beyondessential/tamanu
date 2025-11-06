import config from 'config';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

import { JWT_TOKEN_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidCredentialError, InvalidTokenError } from '@tamanu/errors';

import {
  getRandomBase64String,
  getRandomU32,
  buildToken,
  isInternalClient,
  verifyToken,
} from './utils';

export const refresh = asyncHandler(async (req, res) => {
  const { body, store } = req;
  const { refreshToken, deviceId } = body;

  const {
    auth: {
      saltRounds,
      secret,
      tokenDuration,
      refreshToken: {
        refreshIdLength,
        tokenDuration: refreshTokenDuration,
        absoluteExpiration,
        secret: refreshSecret,
      },
    },
    canonicalHostName,
  } = config;

  if (!isInternalClient(req.header('X-Tamanu-Client'))) {
    throw new InvalidCredentialError('Refresh tokens are only available to internal clients');
  }

  let contents = null;
  try {
    contents = await verifyToken(refreshToken, refreshSecret, {
      audience: JWT_TOKEN_TYPES.REFRESH,
      issuer: canonicalHostName,
    });
  } catch (e) {
    throw new InvalidTokenError('validity');
  }

  const { userId, refreshId } = contents.payload;

  const user = await store.models.User.findOne({
    where: { id: userId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  });

  if (!user) {
    throw new InvalidTokenError('user');
  }

  const dbEntry = await store.models.RefreshToken.findOne({
    where: {
      userId,
      deviceId,
    },
  });

  if (!dbEntry) {
    throw new InvalidTokenError('row');
  }

  if (dbEntry.expiresAt < new Date()) {
    throw new InvalidTokenError('expired');
  }

  const refreshIdValid = await bcrypt.compare(refreshId, dbEntry.refreshId);

  if (!refreshIdValid) {
    throw new InvalidTokenError('id');
  }

  // issue new access token
  const accessTokenJwtId = getRandomU32();
  const token = await buildToken(
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

  const newRefreshToken = await buildToken(
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
  // Extract expiry as set by jose.SignJWT
  const { exp } = jose.decodeJwt(newRefreshToken);

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
