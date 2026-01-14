import crypto from 'node:crypto';
import { compare } from 'bcrypt';
import config from 'config';
import * as jose from 'jose';
import ms from 'ms';
import * as z from 'zod';
import { JWT_KEY_ALG, JWT_KEY_ID, JWT_TOKEN_TYPES, SERVER_TYPES } from '@tamanu/constants';
import { context, propagation, trace } from '@opentelemetry/api';
import { AuthPermissionError, ERROR_TYPE, MissingCredentialError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { ReadSettings } from '@tamanu/settings';
import { version } from '../../package.json';
import { initAuditActions } from '@tamanu/database/utils/audit';

import { CentralServerConnection } from '../sync';

const { tokenDuration, secret } = config.auth;

const jwtSecretKey = secret ?? crypto.randomBytes(32).toString('hex');

export async function buildToken({
  user,
  expiresIn = tokenDuration ?? '1h',
  deviceId = undefined,
  facilityId = undefined,
}) {
  const secretKey = crypto.createSecretKey(new TextEncoder().encode(jwtSecretKey));
  const { canonicalHostName = 'localhost' } = config;

  let expirationTime;
  try {
    if (!expiresIn) {
      throw new Error('No duration provided');
    }
    const timeMs = ms(expiresIn);
    if (timeMs === undefined || timeMs === null) {
      throw new Error(`ms() returned ${timeMs} for duration: ${expiresIn}`);
    }
    expirationTime = Math.floor((Date.now() + timeMs) / 1000);
  } catch (error) {
    throw new Error(`Invalid time period format: ${expiresIn} (${error.message})`);
  }

  return await new jose.SignJWT({
    userId: user.id,
    deviceId,
    facilityId,
  })
    .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
    .setJti(crypto.randomBytes(32).toString('base64url'))
    .setIssuer(canonicalHostName)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setAudience(JWT_TOKEN_TYPES.ACCESS)
    .sign(secretKey);
}

export async function comparePassword(user, password) {
  try {
    // do the password comparison even if the user is invalid so
    // that the login check doesn't reveal whether a user exists or not
    return await compare(password, user?.password ?? 'invalid-hash');
  } catch (e) {
    return false;
  }
}

export async function centralServerLogin({
  models,
  email,
  password,
  deviceId,
  facilityDeviceId,
  settings,
}) {
  // try logging in to central server
  const centralServer = new CentralServerConnection({ deviceId });
  const response = await centralServer.login(email, password, {
    scopes: [],
    body: {
      facilityIds: selectFacilityIds(config),
      facilityDeviceId,
    },
    backoff: {
      maxAttempts: 1,
    },
  });

  // we've logged in as a valid central user - update local database to match
  const { user, localisation, allowedFacilities } = response;
  const { id, ...userDetails } = user;

  const userModel = await models.User.sequelize.transaction(async () => {
    const [user] = await models.User.upsert({
      id,
      ...userDetails,
      deletedAt: null,
    });
    await models.UserLocalisationCache.upsert({
      userId: id,
      localisation: JSON.stringify(localisation),
      deletedAt: null,
    });
    return user;
  });

  await models.Device.ensureRegistration({ settings, user: userModel, deviceId, scopes: [] });

  return { central: true, user, localisation, allowedFacilities };
}

async function localLogin({ models, settings, email, password, deviceId }) {
  const {
    auth: { secret, tokenDuration },
    canonicalHostName,
  } = config;
  const { user } = await models.User.loginFromCredential(
    {
      email,
      password,
      deviceId,
    },
    { log, settings, tokenDuration, tokenIssuer: canonicalHostName, tokenSecret: secret },
  );

  const allowedFacilities = await user.allowedFacilities();

  const localisation = await models.UserLocalisationCache.getLocalisation({
    where: { userId: user.id },
    order: [['createdAt', 'DESC']],
  });

  return {
    central: false,
    user: user.get({ plain: true }),
    allowedFacilities,
    localisation,
  };
}

async function centralServerLoginWithLocalFallback({
  models,
  settings,
  email,
  password,
  deviceId,
  facilityDeviceId,
}) {
  // always log in locally when testing
  if (process.env.NODE_ENV === 'test' && !process.env.IS_PLAYWRIGHT_TEST) {
    return await localLogin({ models, settings, email, password, deviceId });
  }

  try {
    return await centralServerLogin({
      models,
      email,
      password,
      deviceId,
      facilityDeviceId,
      settings,
    });
  } catch (e) {
    // if we get an authentication or forbidden error when login to central server,
    // throw the error instead of proceeding to local login
    if (e.type && (e.type.startsWith(ERROR_TYPE.AUTH) || [ERROR_TYPE.FORBIDDEN, ERROR_TYPE.RATE_LIMITED].includes(e.type))) {
      throw e;
    }

    log.warn(`centralServerLoginWithLocalFallback: central server login failed: ${e}`);
    return await localLogin({ models, settings, email, password, deviceId });
  }
}

export async function loginHandler(req, res, next) {
  const { body, deviceId: facilityDeviceId, models, settings } = req;
  const { deviceId, email, password } = await z
    .object({
      deviceId: z.string().min(1),
      email: z.email(),
      password: z.string().min(1),
    })
    .parseAsync(body);

  // no permission needed for login
  req.flagPermissionChecked();

  try {
    // For facility servers, settings is a map of facilityId -> ReadSettings
    // For login, we need global settings since there's no facility context yet
    const globalSettings =
      settings.global ?? (typeof settings.get === 'function' ? settings : new ReadSettings(models, { countryTimeZone: config.countryTimeZone }));

    const { central, user, localisation, allowedFacilities } =
      await centralServerLoginWithLocalFallback({
        models,
        settings: globalSettings,
        email,
        password,
        deviceId,
        facilityDeviceId,
      });

    // check if user has access to any facilities on this server
    const serverFacilities = selectFacilityIds(config);
    const availableFacilities = await models.User.filterAllowedFacilities(
      allowedFacilities,
      serverFacilities,
    );
    if (availableFacilities.length === 0) {
      throw new AuthPermissionError('User does not have access to any facilities on this server');
    }

    const [permissions, token, role] = await Promise.all([
      getPermissionsForRoles(models, user.role),
      buildToken({ user, deviceId }),
      models.Role.findByPk(user.role),
    ]);
    res.send({
      token,
      central,
      localisation,
      permissions,
      role: role?.forResponse() ?? null,
      serverType: SERVER_TYPES.FACILITY,
      availableFacilities,
    });
  } catch (e) {
    next(e);
  }
}

export async function setFacilityHandler(req, res, next) {
  const { user, body, userDevice: device } = req;

  try {
    // Run after auth middleware, requires valid token but no other permission
    req.flagPermissionChecked();

    const userInstance = await req.models.User.findByPk(user.id);

    const { facilityId } = await z.object({ facilityId: z.string().min(1) }).parseAsync(body);
    const hasAccess = await userInstance.canAccessFacility(facilityId);
    if (!hasAccess) {
      throw new AuthPermissionError('User does not have access to this facility');
    }

    const token = await buildToken({ user, deviceId: device.id, facilityId });
    const settings = await req.settings[facilityId]?.getFrontEndSettings();
    res.send({ token, settings });
  } catch (e) {
    next(e);
  }
}

export async function refreshHandler(req, res) {
  const { user, userDevice, facilityId } = req;

  // Run after auth middleware, requires valid token but no other permission
  req.flagPermissionChecked();

  const token = await buildToken({ user, facilityId, deviceId: userDevice.id });
  res.send({ token });
}

export const authMiddleware = async (req, res, next) => {
  const { canonicalHostName = 'localhost' } = config;
  const { models, settings } = req;
  try {
    const { token, user, facility, device } = await models.User.loginFromAuthorizationHeader(
      req.get('authorization'),
      {
        log,
        settings: settings.global ?? settings,
        tokenDuration,
        tokenIssuer: canonicalHostName,
        tokenSecret: jwtSecretKey,
      },
    );

    if (!device) {
      throw new MissingCredentialError('Missing deviceId');
    }

    // when we login to a multi-facility server, we don't initially have a facilityId
    if (facility) {
      req.facilityId = facility.id; // eslint-disable-line require-atomic-updates
    }

    const sessionId = createSessionIdentifier(token);
    req.user = user; // eslint-disable-line require-atomic-updates
    req.userDevice = device; // eslint-disable-line require-atomic-updates
    req.sessionId = sessionId; // eslint-disable-line require-atomic-updates
    req.getLocalisation = async () =>
      req.models.UserLocalisationCache.getLocalisation({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });

    const auditSettings = await settings?.[req.facilityId]?.get('audit');

    // Auditing middleware
    // eslint-disable-next-line require-atomic-updates
    req.audit = initAuditActions(req, {
      enabled: auditSettings?.accesses.enabled,
      userId: user.id,
      version,
      backEndContext: { serverType: SERVER_TYPES.FACILITY },
    });

    const spanAttributes = {
      'enduser.id': user.id,
      'enduser.role': user.role,
      'session.deviceId': device.id,
    };

    if (facility) {
      spanAttributes['session.facilityId'] = facility.id;
    }

    // eslint-disable-next-line no-unused-expressions
    trace.getActiveSpan()?.setAttributes(spanAttributes);
    context.with(
      propagation.setBaggage(context.active(), propagation.createBaggage(spanAttributes)),
      () => next(),
    );
  } catch (e) {
    next(e);
  }
};
