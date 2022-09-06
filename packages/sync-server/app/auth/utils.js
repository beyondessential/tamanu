import Sequelize from 'sequelize';
import config from 'config';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const JWT_SECRET = config.auth.secret || uuid();

export const FAKE_TOKEN = 'fake-token';

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = async (user, expiry) => {
  return jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
    { expiresIn: expiry },
  );
};

export const verifyToken = token => {
  return jwt.verify(token, JWT_SECRET);
};

export const findUser = async (models, email) => {
  const user = await models.User.scope('withPassword').findOne({
    // email addresses are case insensitive so compare them as such
    where: Sequelize.where(
      Sequelize.fn('lower', Sequelize.col('email')),
      Sequelize.fn('lower', email),
    ),
  });
  if (!user) {
    return null;
  }
  return user.get({ plain: true });
};

export const findUserById = async (models, id) => {
  const user = await models.User.findByPk(id);
  if (!user) {
    return null;
  }
  return user.get({ plain: true });
};
