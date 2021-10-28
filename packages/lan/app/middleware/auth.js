import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import config from 'config';
import { v4 as uuid } from 'uuid';

import { BadAuthenticationError } from 'shared/errors';
import { log } from 'shared/services/logging';

import { WebRemote } from '~/sync';

const { tokenDuration, secret } = config.auth;

// TODO: supports versions desktop-1.2.0/mobile-1.2.14 and older, remove once we no longer support these
const featureFlags = {
  patientFieldOverrides: {
    displayId: {
      shortLabel: 'NHN',
      longLabel: 'National Health Number',
      hidden: false,
    },
  },
};

// regenerate the secret key whenever the server restarts.
// this will invalidate all current tokens, but they're meant to expire fairly quickly anyway.
const jwtSecretKey = secret || uuid();

export function getToken(user, expiresIn = tokenDuration) {
  return sign(
    {
      userId: user.id,
    },
    jwtSecretKey,
    { expiresIn },
  );
}

async function comparePassword(user, password) {
  try {
    const passwordHash = user && user.password;

    // do the password comparison even if the user is invalid so
    // that the login check doesn't reveal whether a user exists or not
    const passwordMatch = await compare(password, passwordHash || 'invalid-hash');

    return user && passwordMatch;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function remoteLogin(models, email, password) {
  // try logging in to sync server
  const remote = new WebRemote();
  const response = await remote.fetch('login', {
    awaitConnection: false,
    retryAuth: false,
    method: 'POST',
    body: {
      email,
      password,
    },
    backoff: {
      maxAttempts: 1,
    },
  });

  // we've logged in as a valid remote user - update local database to match
  const { user, localisation } = response;
  const { id, ...userDetails } = user;

  await models.User.sequelize.transaction(async () => {
    await models.User.upsert(
      {
        id,
        ...userDetails,
        password,
      },
      { where: { id } },
    );
    await models.UserLocalisationCache.upsert({
      userId: id,
      localisation: JSON.stringify(localisation),
    });
  });

  const token = getToken(user);
  return { token, remote: true, localisation, featureFlags };
}

async function localLogin(models, email, password) {
  // some other error in communicating with sync server, revert to local login
  const user = await models.User.scope('withPassword').findOne({ where: { email } });
  const passwordMatch = await comparePassword(user, password);

  if (!passwordMatch) {
    throw new BadAuthenticationError('Incorrect username or password, please try again');
  }

  const localisation = await models.UserLocalisationCache.getLocalisation({
    where: { userId: user.id },
  });

  const token = getToken(user);
  return { token, remote: false, localisation, featureFlags };
}

async function remoteLoginWithLocalFallback(models, email, password) {
  // always log in locally when testing
  if (process.env.NODE_ENV === 'test') {
    return localLogin(models, email, password);
  }

  try {
    return await remoteLogin(models, email, password);
  } catch (e) {
    if (e.name === 'BadAuthenticationError') {
      // actual bad credentials server-side
      throw new BadAuthenticationError('Incorrect username or password, please try again');
    }

    log.warn(`remoteLoginWithLocalFallback: remote login failed: ${e}`);
    return localLogin(models, email, password);
  }
}

export async function loginHandler(req, res, next) {
  const { body, models } = req;
  const { email, password } = body;

  // no permission needed for login
  req.flagPermissionChecked();

  try {
    const responseData = await remoteLoginWithLocalFallback(models, email, password);
    const facility = await models.Facility.findByPk(config.currentFacilityId);
    res.send({
      ...responseData,
      server: {
        facility: facility && facility.forResponse(),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function refreshHandler(req, res) {
  const { user } = req;

  const token = getToken(user);
  res.send({ token });
}

function decodeToken(token) {
  return verify(token, jwtSecretKey);
}

async function getUserFromToken(request) {
  const { models, headers } = request;
  const authHeader = headers.authorization || '';
  if (!authHeader) return null;

  const bearer = authHeader.match(/Bearer (\S*)/);
  if (!bearer) {
    throw new BadAuthenticationError('Missing auth token header');
  }

  const token = bearer[1];
  try {
    const { userId } = decodeToken(token);
    return models.User.findByPk(userId);
  } catch (e) {
    throw new BadAuthenticationError(
      'Your session has expired or is invalid. Please log in again.',
    );
  }
}

export const authMiddleware = async (req, res, next) => {
  try {
    req.user = await getUserFromToken(req);
    req.getLocalisation = async () =>
      req.models.UserLocalisationCache.getLocalisation({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });
    next();
  } catch (e) {
    next(e);
  }
};
