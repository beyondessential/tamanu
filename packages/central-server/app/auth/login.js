import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { SERVER_TYPES, JWT_TOKEN_TYPES } from '@tamanu/constants';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { log } from '@tamanu/shared/services/logging';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getRandomBase64String, getRandomU32, buildToken, stripUser } from './utils';

const getRefreshToken = async (models, { refreshSecret, userId, deviceId }) => {
  const { RefreshToken } = models;
  const {
    auth: {
      saltRounds,
      refreshToken: { refreshIdLength, tokenDuration: refreshTokenDuration },
    },
    canonicalHostName,
  } = config;

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

  // Extract expiry as set by jose.SignJWT
  const { exp } = jose.decodeJwt(refreshToken);
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

export const login = asyncHandler(async (req, res) => {
  const {
    auth: {
      secret,
      tokenDuration,
      refreshToken: { secret: refreshSecret },
    },
    canonicalHostName,
  } = config;
  const {
    store: {
      models,
      models: { User },
    },
    body,
    settings,
  } = req;

  const {
    token,
    user,
    device,
    internalClient,
    settings: userSettings,
  } = await User.loginFromCredential(
    {
      ...body,
      clientHeader: req.header('X-Tamanu-Client'),
    },
    { log, settings, tokenDuration, tokenIssuer: canonicalHostName, tokenSecret: secret },
  );

  const [refreshToken, allowedFacilities, localisation, permissions, role] = await Promise.all([
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
  const { canonicalHostName: centralHost, globalTimeZone } = config;
  res.send({
    token,
    refreshToken,
    user: convertFromDbRecord(stripUser(user.get({ plain: true }))).data,
    permissions,
    serverType: SERVER_TYPES.CENTRAL,
    role: role?.forResponse() ?? null,
    allowedFacilities,
    localisation,
    centralHost,
    globalTimeZone,
    settings: userSettings,
  });
});
