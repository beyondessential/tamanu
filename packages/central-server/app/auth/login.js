import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SERVER_TYPES } from '@tamanu/constants';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import {
  getRandomBase64String,
  getRandomU32,
  buildToken,
  isInternalClient,
  stripUser,
} from './utils';
import log from '@tamanu/shared/log';

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
    const { store, body, settings } = req;
    const { models } = store;
    const { email, password, facilityIds, deviceId } = body;
    const tamanuClient = req.header('X-Tamanu-Client');

    const getSettingsForFrontEnd = async () => {
      // Only attach central scoped settings if login request is for central admin panel login
      if ([SERVER_TYPES.WEBAPP, SERVER_TYPES.MOBILE].includes(tamanuClient) && !facilityIds) {
        return await settings.getFrontEndSettings();
      }
    };

    if (!email || !password) {
      log.warn('Missing credentials');
      throw new BadAuthenticationError('Missing credentials');
    }

    const internalClient = isInternalClient(tamanuClient);
    if (internalClient && !deviceId) {
      log.warm('Missing deviceId');
      throw new BadAuthenticationError('Missing deviceId');
    }

    const user = await models.User.getForAuthByEmail(email);
    if (!user && config.auth.reportNoUserError) {
      // an attacker can use this to get a list of user accounts
      // but hiding this error entirely can make debugging a hassle
      // so we just put it behind a config flag
      log.warn('No such user');
      throw new BadAuthenticationError('No such user');
    }

    const hashedPassword = user?.password || '';
    if (!(await bcrypt.compare(password, hashedPassword))) {
      log.warn('Bad password');
      throw new BadAuthenticationError('Invalid credentials');
    }

    const { auth, canonicalHostName } = config;
    const { tokenDuration } = auth;
    const accessTokenJwtId = getRandomU32();
    const [token, refreshToken, allowedFacilities, localisation, permissions, role] =
      await Promise.all([
        buildToken(
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
        ),
        internalClient
          ? getRefreshToken(models, { refreshSecret, userId: user.id, deviceId })
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
      settings: await getSettingsForFrontEnd(),
    });
  });
