import config from 'config';
import asyncHandler from 'express-async-handler';
import { BadAuthenticationError } from 'shared/errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getToken, verifyToken, findUserById, getRandomU32, getRandomBase64String } from './utils';

export const refresh = ({ secret, refreshSecret }) =>
  asyncHandler(async (req, res) => {
    const { body, store } = req;
    const { refreshToken, deviceId } = body;

    const { canonicalHostName, auth } = config;
    const {
      tokenDuration,
      saltRounds,
      refreshToken: { refreshIdLength, tokenDuration: refreshTokenDuration },
    } = auth;

    const clientId = req.header('X-Tamanu-Client');

    let contents = null;
    try {
      contents = verifyToken(refreshToken, refreshSecret, {
        audience: clientId,
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
      },
      secret,
      {
        expiresIn: tokenDuration,
        audience: clientId,
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
      },
      refreshSecret,
      {
        expiresIn: refreshTokenDuration,
        audience: clientId,
        issuer: canonicalHostName,
        jwtid: `${refreshTokenJwtId}`,
      },
    );
    // Extract expiry as set by jwt.sign
    const { exp } = jwt.decode(newRefreshToken);

    await store.models.RefreshToken.upsert(
      {
        refreshId: hashedRefreshId,
        expiresAt: new Date(exp * 1000),
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

    res.send({
      token,
      refreshToken: newRefreshToken,
    });
  });
