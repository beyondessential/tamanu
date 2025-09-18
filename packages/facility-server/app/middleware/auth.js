import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { compare } from 'bcrypt';
import config from 'config';
import { sign as signCallback } from 'jsonwebtoken';
import { context, propagation, trace } from '@opentelemetry/api';
import { SERVER_TYPES } from '@tamanu/constants';
import { AuthPermissionError, ERROR_TYPE, InvalidTokenError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { version } from '../../package.json';
import { CentralServerConnection } from '../sync';

const { tokenDuration, secret } = config.auth;

// regenerate the secret key whenever the server restarts.
// this will invalidate all current tokens, but they're meant to expire fairly quickly anyway.
const jwtSecretKey = secret || crypto.randomUUID();
const sign = promisify(signCallback);

export async function buildToken(user, facilityId, expiresIn = tokenDuration) {
  return sign(
    {
      userId: user.id,
      facilityId,
    },
    jwtSecretKey,
    { expiresIn },
  );
}

export async function comparePassword(user, password) {
  try {
    const passwordHash = user && user.password;

    // do the password comparison even if the user is invalid so
    // that the login check doesn't reveal whether a user exists or not
    const passwordMatch = await compare(password, passwordHash || 'invalid-hash');

    return user && passwordMatch;
  } catch (e) {
    return false;
  }
}

export async function centralServerLogin(models, email, password, deviceId) {
  // try logging in to central server
  const centralServer = new CentralServerConnection({ deviceId });
  const response = await centralServer.fetch('login', {
    awaitConnection: false,
    retryAuth: false,
    method: 'POST',
    body: {
      email,
      password,
      deviceId,
      facilityIds: selectFacilityIds(config),
    },
    backoff: {
      maxAttempts: 1,
    },
  });

  // we've logged in as a valid central user - update local database to match
  const { user, localisation, allowedFacilities } = response;
  const { id, ...userDetails } = user;

  await models.User.sequelize.transaction(async () => {
    await models.User.upsert({
      id,
      ...userDetails,
      password,
      deletedAt: null,
    });
    await models.UserLocalisationCache.upsert({
      userId: id,
      localisation: JSON.stringify(localisation),
      deletedAt: null,
    });
  });

  return { central: true, user, localisation, allowedFacilities };
}

async function localLogin(models, settings, email, password) {
  const { user } = await models.User.loginFromCredential(
    {
      email,
      password,
    },
    { log, settings },
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

async function centralServerLoginWithLocalFallback(models, settings, email, password, deviceId) {
  // always log in locally when testing
  if (process.env.NODE_ENV === 'test' && !process.env.IS_PLAYWRIGHT_TEST) {
    return localLogin(models, settings, email, password);
  }

  try {
    return await centralServerLogin(models, email, password, deviceId);
  } catch (e) {
    // if we get an authentication or forbidden error when login to central server,
    // throw the error instead of proceeding to local login
    if (e.type.startsWith(ERROR_TYPE.AUTH) || e.type === ERROR_TYPE.FORBIDDEN) {
      throw e;
    }

    log.warn(`centralServerLoginWithLocalFallback: central server login failed: ${e}`);
    return localLogin(models, settings, email, password);
  }
}

export async function loginHandler(req, res, next) {
  const { body, models, deviceId, settings } = req;
  const { email, password } = body;

  // no permission needed for login
  req.flagPermissionChecked();

  try {
    const { central, user, localisation, allowedFacilities } =
      await centralServerLoginWithLocalFallback(models, settings, email, password, deviceId);

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
      buildToken(user),
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
  const { user, body } = req;
  const { facilityId } = body;

  try {
    // Run after auth middleware, requires valid token but no other permission
    req.flagPermissionChecked();

    const hasAccess = await user.canAccessFacility(facilityId);
    if (!hasAccess) {
      throw new AuthPermissionError('User does not have access to this facility');
    }
    const token = await buildToken(user, facilityId);
    const settings = await req.settings[facilityId]?.getFrontEndSettings();
    res.send({ token, settings });
  } catch (e) {
    next(e);
  }
}

export async function refreshHandler(req, res) {
  const { user, facilityId } = req;

  // Run after auth middleware, requires valid token but no other permission
  req.flagPermissionChecked();

  const token = await buildToken(user, facilityId);
  res.send({ token });
}

export const authMiddleware = async (req, res, next) => {
  const {
    auth: { secret },
    canonicalHostName,
  } = config;
  const { models, settings } = req;
  try {
    const { token, user, facility, device } = await models.User.loginFromAuthorizationHeader(
      req.headers.get('authorization'),
      { log, settings, tokenDuration, tokenIssuer: canonicalHostName, tokenSecret: secret },
    );

    if (!facility) {
      throw new InvalidTokenError('Missing facilityId in token');
    }

    const sessionId = createSessionIdentifier(token);
    req.user = user; // eslint-disable-line require-atomic-updates
    req.facilityId = facility.id; // eslint-disable-line require-atomic-updates
    req.sessionId = sessionId; // eslint-disable-line require-atomic-updates
    req.getLocalisation = async () =>
      req.models.UserLocalisationCache.getLocalisation({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });

    const auditSettings = await settings?.[req.facilityId]?.get('audit');

    // Auditing middleware
    // eslint-disable-next-line require-atomic-updates
    req.audit = {
      access: async ({ recordId, params, model }) => {
        if (!auditSettings?.accesses.enabled) return;
        return req.models.AccessLog.create({
          userId: user.id,
          recordId,
          recordType: model.name,
          sessionId,
          isMobile: false,
          frontEndContext: params,
          backEndContext: { endpoint: req.originalUrl },
          loggedAt: new Date(),
          facilityId: facility.id,
          deviceId: device?.id ?? req.deviceId ?? 'unknown-device',
          version,
        });
      },
    };

    const spanAttributes = {};
    if (req.user) {
      spanAttributes['enduser.id'] = req.user.id;
      spanAttributes['enduser.role'] = req.user.role;
    }
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
