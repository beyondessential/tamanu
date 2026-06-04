import asyncHandler from 'express-async-handler';
import config from 'config';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { SERVER_TYPES, JWT_TOKEN_TYPES, MFA_CHALLENGE_TYPES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { log } from '@tamanu/shared/services/logging';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getLocalisation } from '../localisation';
import { convertFromDbRecord } from '../convertDbRecord';
import { getRandomBase64String, getRandomU32, buildToken, stripUser } from './utils';
import { resolveLoginMfaPolicy } from './mfa';
import { assertIpAllowed, isIpExempt, resolveClientIp } from './clientIp';

// short — long enough to complete a fumbly forced enrolment (scan/add to an
// authenticator app, type a code), but the pass is also single-use (consumed
// on successful completion), so this only bounds an abandoned/leaked pass
const MFA_LOGIN_SESSION_EXPIRY_MINUTES = 5;

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

  // IP policy first: the allowlist refuses out-of-range logins before any
  // credential handling, and exemption feeds the MFA decision below
  const clientIp = await resolveClientIp(req);
  await assertIpAllowed(req, clientIp);

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
  const decision = await resolveLoginMfaPolicy(req, user, {
    ipExempt: await isIpExempt(req, clientIp),
  });
  if (decision.kind === 'blocked') {
    // nothing the user has can be verified or enrolled here — never downgrade
    // to password-only
    throw new ForbiddenError('Multi-factor authentication is required but not available');
  }
  if (decision.kind !== 'none') {
    // pause the login: no access or refresh token yet, just a short-lived
    // pass for the /mfa/login completion endpoints. The access token minted
    // by loginFromCredential is discarded, never disclosed.
    //
    // The pass is single-use: a nonce is stored in mfa_challenges and consumed
    // on successful completion, so a completed (or leaked-after-use) pass can't
    // be replayed to mint further sessions within its lifetime.
    const expiresAt = new Date(Date.now() + MFA_LOGIN_SESSION_EXPIRY_MINUTES * 60 * 1000);
    const nonce = await getRandomBase64String(32, 'base64url');
    await models.MfaChallenge.create({
      type: MFA_CHALLENGE_TYPES.LOGIN,
      token: nonce,
      userId: user.id,
      expiresAt,
    });
    const mfaToken = await buildToken(
      {
        userId: user.id,
        deviceId: device?.id,
        internalClient,
        withSettings: userSettings !== undefined,
        kind: decision.kind,
        nonce,
      },
      secret,
      {
        expiresIn: `${MFA_LOGIN_SESSION_EXPIRY_MINUTES} minutes`,
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
