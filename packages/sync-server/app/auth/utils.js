import Sequelize from 'sequelize';
import jwt from 'jsonwebtoken';
import { randomBytes, randomInt } from 'crypto';

const MAX_U32_VALUE = 2 ** 32 - 1;

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = (data, secret, options) => jwt.sign(data, secret, options);

export const getRandomBase64String = async length => {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString('base64'));
    });
  });
};

export const getRandomU32 = () => {
  return randomInt(0, MAX_U32_VALUE);
};

export const verifyToken = (token, secret, options) => jwt.verify(token, secret, options);

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

export const isInternalClient = client =>
  ['Tamanu Mobile', 'Tamanu Desktop', 'Tamanu LAN Server'].includes(client);
