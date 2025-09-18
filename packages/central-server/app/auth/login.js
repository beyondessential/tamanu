import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SERVER_TYPES, JWT_TOKEN_TYPES } from '@tamanu/constants';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { log } from '@tamanu/shared/services/logging';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getRandomBase64String, getRandomU32, buildToken, stripUser } from './utils';

const getRefreshToken = async (models, { refreshSecret, userId, deviceId }) => {
  const { RefreshToken } = models;
  const { auth, canonicalHostName } = config;
  const {
    saltRounds,
    refreshToken: { refreshIdLength, tokenDuration: refreshTokenDuration },
  } = auth;

  const refreshId = await getRandomBase64String(refreshIdLength);
  const refreshTokenJwtId = getRandomU32();
  const [hashedRefreshId, refreshToken] = await Promise.all([
    bcrypt.hash(refreshId, saltRounds),
    buildToken(
      {
        userId,
        refreshId,
      },
      refreshSecret,
      {
        expiresIn: refreshTokenDuration,
        audience: JWT_TOKEN_TYPES.REFRESH,
        issuer: canonicalHostName,
        jwtid: `${refreshTokenJwtId}`,
      },
    ),
  ]);

  // Extract expiry as set by jwt.sign
  const { exp } = jwt.decode(refreshToken);
  await RefreshToken.upsert(
    {
      refreshId: hashedRefreshId,
      expiresAt: new Date(exp * 1000),
      userId,
      deviceId,
    },
    {
      where: {
        userId,
        deviceId,
      },
    },
  );

  return refreshToken;
};

export const login = ({ secret, refreshSecret }) =>
  asyncHandler(async (req, res) => {
    const {
      store: {
        models,
        models: { User },
      },
      body,
      settings,
    } = req;

    const {
      user,
      device,
      internalClient,
      settings: userSettings,
    } = await User.login(
      {
        ...body,
        clientHeader: req.header('X-Tamanu-Client'),
      },
      { log, settings },
    );

    const { auth, canonicalHostName } = config;
    const { tokenDuration } = auth;
    const accessTokenJwtId = getRandomU32();
    const [token, refreshToken, allowedFacilities, localisation, permissions, role] =
      await Promise.all([
        buildToken(
          {
            userId: user.id,
            deviceId: device?.id,
          },
          secret,
          {
            expiresIn: tokenDuration,
            audience: JWT_TOKEN_TYPES.ACCESS,
            issuer: canonicalHostName,
            jwtid: `${accessTokenJwtId}`,
          },
        ),
        internalClient
          ? getRefreshToken(models, { refreshSecret, userId: user.id, deviceId: device?.id })
          : undefined,
        user.allowedFacilities(),
        getLocalisation(),
        getPermissionsForRoles(models, user.role),
        models.Role.findByPk(user.role),
      ]);

    // Send some additional data with login to tell the user about
    // the context they've just logged in to.
    res.send({
      token,
      refreshToken,
      user: convertFromDbRecord(stripUser(user.get({ plain: true }))).data,
      permissions,
      serverType: SERVER_TYPES.CENTRAL,
      role: role?.forResponse() ?? null,
      allowedFacilities,
      localisation,
      centralHost: config.canonicalHostName,
      settings: userSettings,
    });
  });
