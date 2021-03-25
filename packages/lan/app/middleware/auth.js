import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { auth } from 'config';

import { v4 as uuid } from 'uuid';

import { WebRemote } from '~/sync';
import { BadAuthenticationError } from 'shared/errors';

const { tokenDuration } = auth;

// regenerate the secret key whenever the server restarts.
// this will invalidate all current tokens, but they're meant to expire fairly quickly anyway.
const jwtSecretKey = uuid();

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

async function remoteLogin(models, email, password) {
  // try logging in to sync server
  const remote = new WebRemote();
  const response = await remote.fetch('login', {
    awaitConnection: false,
    retryAuth: false,
    method: 'POST',
    body: {
      email,
      password,
    }
  });

  // we've logged in as a valid remote user - update local database to match
  const { user } = response;
  const { id, ...userDetails } = user;
  await models.User.upsert(
    {
      id,
      ...userDetails,
      password,
    },
    { where: { id } }
  );

  const token = getToken(user);
  return { token, remote: true };
}

async function localLogin(models, email, password) {
  // some other error in communicating with sync server, revert to local login
  const user = await models.User.scope('withPassword').findOne({ where: { email } });
  const passwordMatch = await comparePassword(user, password);

  if (!passwordMatch) {
    throw new BadAuthenticationError('Incorrect username or password, please try again');
  }

  const token = getToken(user);
  return { token, remote: false };
}

async function remoteLoginWithLocalFallback(models, email, password) {
  // always log in locally when testing
  if(process.env.NODE_ENV === 'test') {
    return await localLogin(models, email, password);
  }

  try {
    return await remoteLogin(models, email, password);
  } catch(e) {
    if(e.name === 'BadAuthenticationError') {
      // actual bad credentials server-side
      throw new BadAuthenticationError('Incorrect username or password, please try again');
    }

    return await localLogin(models, email, password);
  }
}

export async function loginHandler(req, res, next) {
  const { body, models } = req;
  const { email, password } = body;

  // no permission needed for login
  req.flagPermissionChecked();

  try {
    const response = await remoteLoginWithLocalFallback(models, email, password);
    res.send(response);
  } catch(e) {
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
    next();
  } catch (e) {
    next(e);
  }
};
