import Sequelize from 'sequelize';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { randomBytes } from 'crypto';

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = (user, secret, expiry) =>
  jwt.sign(
    {
      userId: user.id,
    },
    secret,
    { expiresIn: expiry },
  );

export const getRandomBase64String = async length => {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString('base64'));
    });
  });
};

export const getExpiration = expiresIn => Date.now() + ms(expiresIn);

export const verifyToken = (token, secret) => jwt.verify(token, secret);

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
