import { context, propagation, trace } from '@opentelemetry/api';
import { sign as signCallback, verify as verifyCallback } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import config from 'config';
import { promisify } from 'util';
import crypto from 'crypto';
import { version } from '../../package.json';

import { SERVER_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  AuthPermissionError,
  ERROR_TYPE,
  ForbiddenError,
  InvalidCredentialError,
  InvalidTokenError,
  MissingCredentialError,
} from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
import { createSessionIdentifier } from '@tamanu/shared/audit/createSessionIdentifier';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { CentralServerConnection } from '../sync';

const { tokenDuration, secret } = config.auth;

// regenerate the secret key whenever the server restarts.
// this will invalidate all current tokens, but they're meant to expire fairly quickly anyway.
const jwtSecretKey = secret || crypto.randomUUID();
const sign = promisify(signCallback);
const verify = promisify(verifyCallback);

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

async function localLogin(models, email, password) {
  // some other error in communicating with central server, revert to local login
  const user = await models.User.getForAuthByEmail(email);
  log.info('User found: ', Boolean(user));

  const passwordMatch = await comparePassword(user, password);

  if (!passwordMatch) {
    log.warn('Bad password match');
    throw new InvalidCredentialError('Incorrect username or password, please try again');
  }

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

async function centralServerLoginWithLocalFallback(models, email, password, deviceId) {
  // always log in locally when testing
  if (process.env.NODE_ENV === 'test' && !process.env.IS_PLAYWRIGHT_TEST) {
    return localLogin(models, email, password);
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
    return localLogin(models, email, password);
  }
}

export async function loginHandler(req, res, next) {
  const { body, models, deviceId } = req;
  const { email, password } = body;

  // no permission needed for login
  req.flagPermissionChecked();

  try {
    const { central, user, localisation, allowedFacilities } =
      await centralServerLoginWithLocalFallback(models, email, password, deviceId);

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

async function decodeToken(token) {
  try {
    return await verify(token, jwtSecretKey);
  } catch (e) {
    throw new InvalidTokenError('Your session has expired or is invalid. Please log in again.');
  }
}

function getTokenFromHeaders(request) {
  const { headers } = request;
  const authHeader = headers.authorization || '';
  if (!authHeader) {
    throw new ForbiddenError();
  }
  const bearer = authHeader.match(/Bearer (\S*)/);
  if (!bearer) {
    throw new MissingCredentialError(
      'Your session has expired or is invalid. Please log in again.',
    );
  }

  const token = bearer[1];
  return token;
}

async function getUser(models, userId) {
  const user = await models.User.findByPk(userId);
  if (user.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
    throw new AuthPermissionError('Your session has expired or is invalid. Please log in again.');
  }
  return user;
}

export const authMiddleware = async (req, res, next) => {
  const { models, settings } = req;
  try {
    const token = getTokenFromHeaders(req);
    const sessionId = createSessionIdentifier(token);
    const { userId, facilityId } = await decodeToken(token);
    const user = await getUser(models, userId);
    req.user = user; // eslint-disable-line require-atomic-updates
    req.facilityId = facilityId; // eslint-disable-line require-atomic-updates
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
          userId,
          recordId,
          recordType: model.name,
          sessionId,
          isMobile: false,
          frontEndContext: params,
          backEndContext: { endpoint: req.originalUrl },
          loggedAt: new Date(),
          facilityId: req.facilityId,
          deviceId: req.deviceId || 'unknown-device',
          version,
        });
      },
    };

    const spanAttributes = {};
    if (req.user) {
      spanAttributes['enduser.id'] = req.user.id;
      spanAttributes['enduser.role'] = req.user.role;
    }
    if (req.facilityId) {
      spanAttributes['session.facilityId'] = req.facilityId;
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
