import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { SERVER_TYPES, JWT_TOKEN_TYPES } from '@tamanu/constants';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { log } from '@tamanu/shared/services/logging';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getRandomBase64String, getRandomU32, buildToken, stripUser } from './utils';
import { getAuthSecret, getCanonicalHostName, getRefreshTokenSecret } from '@tamanu/shared/utils';

const getRefreshToken = async (models, settings, { refreshSecret, userId, deviceId }) => {
  const { RefreshToken } = models;
  const [refreshIdLength, refreshTokenDuration] = await Promise.all([
    settings.get('auth.refreshToken.refreshIdLength'),
    settings.get('auth.refreshToken.tokenDuration'),
  ]);
  const saltRounds = models.User.SALT_ROUNDS;
  const canonicalHostName = getCanonicalHostName();

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
  const secret = getAuthSecret();
  const refreshSecret = getRefreshTokenSecret();
  const canonicalHostName = getCanonicalHostName();
  const {
    store: {
      models,
      models: { User },
    },
    body,
    settings,
  } = req;
  const tokenDuration = await settings.get('auth.tokenDuration');

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
      ? getRefreshToken(models, settings, { refreshSecret, userId: user.id, deviceId: device?.id })
      : undefined,
    user.allowedFacilities(),
    getLocalisation(settings),
    getPermissionsForRoles(models, user.role),
    models.Role.findByPk(user.role),
  ]);

  // Send some additional data with login to tell the user about
  // the context they've just logged in to.
  const centralHost = getCanonicalHostName();
  const primaryTimeZone = getPrimaryTimeZone();
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
    primaryTimeZone,
    settings: userSettings,
  });
});
