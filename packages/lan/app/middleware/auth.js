import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { auth } from 'config';

import { BadAuthenticationError } from 'lan/app/errors';

const { tokenDuration, jwtSecretKey } = auth;

// don't even let things start if the key hasn't been configured in prod
if (!['development', 'test'].includes(process.env.NODE_ENV)) {
  if (!jwtSecretKey || jwtSecretKey === 'DEFAULT_SECRET_KEY') {
    throw new Error('Please configure the JWT secret key for running in production.');
  }
}

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

export async function loginHandler(req, res, next) {
  const { body, models } = req;
  const { email, password } = body;

  // no permission needed for login
  req.flagPermissionChecked();

  const user = await models.User.findOne({ where: { email } });
  const passwordMatch = await comparePassword(user, password);

  if (!passwordMatch) {
    next(new BadAuthenticationError());
    return;
  }

  const token = getToken(user);
  res.send({ token });
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
    throw new BadAuthenticationError();
  }

  const token = bearer[1];
  try {
    const { userId } = decodeToken(token);
    return models.User.findByPk(userId);
  } catch (e) {
    throw new BadAuthenticationError();
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
