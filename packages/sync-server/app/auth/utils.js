import jwt from 'jsonwebtoken';

export const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

export const getToken = async (user, secret, expiry) =>
  jwt.sign(
    {
      userId: user.id,
    },
    secret,
    { expiresIn: expiry },
  );

export const verifyToken = (token, secret) => jwt.verify(token, secret);
