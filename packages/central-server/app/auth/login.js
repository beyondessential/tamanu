import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { SERVER_TYPES, JWT_TOKEN_TYPES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { log } from '@tamanu/shared/services/logging';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getRandomBase64String, getRandomU32, buildToken, stripUser } from './utils';
import { resolveLoginMfaPolicy } from './mfa';

const MFA_LOGIN_SESSION_EXPIRY = '10 minutes';

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

/**
 * The full successful-login payload. Shared between the plain login path and
 * the MFA completion endpoints, which finish a login that the policy paused.
 * Long-lived credentials (the refresh token) are only ever minted here — that
 * is, only once any owed second factor has been satisfied.
 *
 * `token` is the access token from loginFromCredential when the login wasn't
 * paused; completion passes none and a fresh one is minted to the same shape.
 */
export const sendLoginSuccessResponse = async (
  res,
  { models, user, deviceId, internalClient, userSettings, token },
) => {
  const {
    auth: {
      secret,
      tokenDuration,
      refreshToken: { secret: refreshSecret },
    },
    canonicalHostName,
  } = config;

  const [accessToken, refreshToken, allowedFacilities, localisation, permissions, role] =
    await Promise.all([
      token ??
        buildToken({ userId: user.id, deviceId }, secret, {
          expiresIn: tokenDuration,
          audience: JWT_TOKEN_TYPES.ACCESS,
          issuer: canonicalHostName,
        }),
      internalClient
        ? getRefreshToken(models, { refreshSecret, userId: user.id, deviceId })
        : undefined,
      user.allowedFacilities(),
      getLocalisation(),
      getPermissionsForRoles(models, user.role),
      models.Role.findByPk(user.role),
    ]);

  const primaryTimeZone = getPrimaryTimeZone(config);
  res.send({
    token: accessToken,
    refreshToken,
    user: convertFromDbRecord(stripUser(user.get({ plain: true }))).data,
    permissions,
    serverType: SERVER_TYPES.CENTRAL,
    role: role?.forResponse() ?? null,
    allowedFacilities,
    localisation,
    centralHost: canonicalHostName,
    primaryTimeZone,
    settings: userSettings,
  });
};

export const login = asyncHandler(async (req, res) => {
  const {
    auth: { secret, tokenDuration },
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

  // The password checked out; does this login owe a second factor?
  const decision = await resolveLoginMfaPolicy(req, user);
  if (decision.kind === 'blocked') {
    // nothing the user has can be verified or enrolled here — never downgrade
    // to password-only
    throw new ForbiddenError('Multi-factor authentication is required but not available');
  }
  if (decision.kind !== 'none') {
    // pause the login: no access or refresh token yet, just a short-lived
    // pass for the /mfa/login completion endpoints. The access token minted
    // by loginFromCredential is discarded, never disclosed.
    const mfaToken = await buildToken(
      {
        userId: user.id,
        deviceId: device?.id,
        internalClient,
        withSettings: userSettings !== undefined,
        kind: decision.kind,
      },
      secret,
      {
        expiresIn: MFA_LOGIN_SESSION_EXPIRY,
        audience: JWT_TOKEN_TYPES.MFA_LOGIN,
        issuer: canonicalHostName,
      },
    );
    res.send({
      mfaPending: {
        kind: decision.kind,
        factors: decision.factors,
        ...(decision.kind === 'enrol' ? { skippable: decision.skippable } : {}),
        token: mfaToken,
      },
      serverType: SERVER_TYPES.CENTRAL,
      centralHost: canonicalHostName,
    });
    return;
  }

  await sendLoginSuccessResponse(res, {
    models,
    user,
    deviceId: device?.id,
    internalClient,
    userSettings,
    token,
  });
});
