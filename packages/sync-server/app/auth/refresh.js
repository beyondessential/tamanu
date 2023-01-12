import config from 'config';
import asyncHandler from 'express-async-handler';
import { BadAuthenticationError } from 'shared/errors';
import ms from 'ms';
import { getToken, verifyToken, findUserById } from './utils';

export const refresh = ({ secret, refreshSecret }) =>
  asyncHandler(async (req, res) => {
    const { body, store } = req;
    const { refreshToken } = body;

    const dbToken = await store.models.RefreshToken.findOne({
      where: {
        token: refreshToken,
      },
    });

    if (!dbToken) {
      throw new BadAuthenticationError('Invalid refresh token');
    }

    if (dbToken.expiresAt < Date.now()) {
      throw new BadAuthenticationError('Refresh token expired');
    }

    let contents = null;
    try {
      contents = verifyToken(refreshToken, refreshSecret);
    } catch (e) {
      throw new BadAuthenticationError('Invalid refresh token');
    }

    const { userId } = contents;

    const user = await findUserById(store.models, userId);

    const newAccessToken = await getToken(user, secret, config.auth.tokenDuration);

    // Refresh Token Rotation
    const newRefreshToken = await getToken(user, refreshSecret, config.auth.refreshTokenDuration);
    await dbToken.destroy();
    await store.models.RefreshToken.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: Date.now() + ms(config.auth.refreshTokenDuration),
    });

    res.send({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + ms(config.auth.tokenDuration),
    });
  });
