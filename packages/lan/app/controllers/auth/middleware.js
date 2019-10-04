import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcrypt';

const SECRET_KEY = '123abc';
const TOKEN_DURATION = '1h';

// TODO: this should live somewhere else
function getToken(user) {
  return sign(
    {
      userId: user._id,
    },
    SECRET_KEY,
    { expiresIn: TOKEN_DURATION },
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

export async function loginHandler(req, res) {
  const db = req.app.get('database');
  const { email, password } = req.body;

  const user = db.objects('user').filtered('email = $0', email, password)[0];
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
  return verify(token, SECRET_KEY);
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
    return findUser(request.app.get('database'), userId);
  } catch (e) {
    return null;
  }
}

export const authMiddleware = (req, res, next) => {
  const user = getUserFromToken(req);
  if (!user) {
    res.status(403);
    throw new Error('This action can only be performed by an authenticated user.');
  }

  req.user = user;
  next();
};
