import { sign, verify } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { auth } from 'config';

const { 
  tokenDuration,
  saltRounds,
  passwordSecretKey,
} = auth;

// TODO: this should live somewhere else
function getToken(user) {
  return sign(
    {
      userId: user._id,
    },
    passwordSecretKey,
    { expiresIn: tokenDuration },
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

async function setPassword(db, user, password) {
  const hashed = await hash(password, saltRounds);
  db.write(() => {
    user.password = hashed;
  });
}

export async function changePasswordHandler(req, res) {
  const { body, db } = req;
  const { email, password } = body;

  const user = db.objects('user').filtered('email = $0', email)[0];

  if(!user) {
    res.send({ error: 'Invalid credentials' });
    return;
  }

  await setPassword(db, user, password);

  res.send({ user });
}

export async function loginHandler(req, res) {
  const { body, db } = req;
  const { email, password } = body;

  const user = db.objects('user').filtered('email = $0', email)[0];
  const passwordMatch = await comparePassword(user, password);

  if (!passwordMatch) {
    res.status(401);
    res.send({
      error: 'Invalid credentials.',
    });
    return;
  }

  const token = getToken(user);
  res.send({ token });
}

function decodeToken(token) {
  return verify(token, passwordSecretKey);
}

function findUser(db, userId) {
  return db.objectForPrimaryKey('user', userId);
}

function getUserFromToken(request) {
  const authHeader = request.headers.authorization || '';
  const bearer = authHeader.match(/Bearer (\S*)/);
  if (!bearer) return null;

  const token = bearer[1];
  try {
    const { userId } = decodeToken(token);
    return findUser(request.db, userId);
  } catch (e) {
    return null;
  }
}

const authMiddleware = (req, res, next) => {
  const user = getUserFromToken(req);
  if (!user) {
    res.status(403);
    throw new Error('This action can only be performed by an authenticated user.');
  }

  req.user = user;
  next();
};

function getDebugUser(req) {
  const { db } = req;
  const user = db.objects('user')[0];
  return user;
}

const debugAuthMiddleware = (req, res, next) => {
  const user = getUserFromToken(req) || getDebugUser(req);
  req.user = user;
  next();
};

export const getAuthMiddleware = () => {
  switch(process.env.NODE_ENV) {
    case 'test':
    case 'development':
      return debugAuthMiddleware;
    default:
      return authMiddleware;
  }
};
