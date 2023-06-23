import config from 'config';
import asyncHandler from 'express-async-handler';
import { JWT_TOKEN_TYPES } from 'shared/constants/auth';
import { BadAuthenticationError } from 'shared/errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  getToken,
  verifyToken,
  findUserById,
  getRandomU32,
  getRandomBase64String,
  isInternalClient,
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
      contents = verifyToken(refreshToken, refreshSecret, {
        audience: JWT_TOKEN_TYPES.REFRESH,
        issuer: canonicalHostName,
      });
    } catch (e) {
      throw new BadAuthenticationError('Invalid token');
    }

    const { userId, refreshId } = contents;

    const user = await findUserById(store.models, userId);

    const dbEntry = await store.models.RefreshToken.findOne({
      where: {
        userId,
        deviceId,
      },
    });

    if (!dbEntry) {
      throw new BadAuthenticationError('Invalid token');
    }

    if (dbEntry.expiresAt < new Date()) {
      throw new BadAuthenticationError('Refresh token expired');
    }

    const refreshIdValid = await bcrypt.compare(refreshId, dbEntry.refreshId);

    if (!refreshIdValid) {
      throw new BadAuthenticationError('Invalid token');
    }

    // issue new access token
    const accessTokenJwtId = getRandomU32();
    const token = getToken(
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

    const newRefreshToken = getToken(
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
