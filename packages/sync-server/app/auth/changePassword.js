import express from 'express';
import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import * as yup from 'yup';
import { ValidationError } from 'yup';
import { findUser } from './utils';

export const changePassword = express.Router();

const schema = yup.object({
  email: yup
    .string()
    .email('Must enter a valid email')
    .required(),
  newPassword: yup
    .string()
    .min(5, 'Must be at least 5 characters')
    .required(),
  token: yup.string().required(),
});

changePassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { store, body } = req;

    await schema.validate(body);

    await doChangePassword(store, body);

    res.send({ ok: 'ok' });
  }),
);

const doChangePassword = async (store, { email, newPassword, token }) => {
  const { models } = store;

  const user = await findUser(models, email);
  const userId = user ? user.id : 'thwart-timing-attack';

  const oneTimeLogin = await models.OneTimeLogin.findOne({
    where: { userId, token },
  });

  if (!oneTimeLogin) {
    log.info(`One time login with email ${email} and token ${token} not found`);
    throw new ValidationError(`User or token not found`);
  }

  if (oneTimeLogin.usedAt !== null) {
    throw new ValidationError(`Token has been used`, token, 'token');
  }

  if (oneTimeLogin.isExpired()) {
    throw new ValidationError(`Token has expired`, token, 'token');
  }

  await models.User.sequelize.transaction(async () => {
    await models.User.update(
      {
        password: newPassword,
      },
      { where: { id: user.id } },
    );

    await models.OneTimeLogin.update(
      {
        usedAt: Date.now(),
      },
      { where: { id: oneTimeLogin.id } },
    );
  });
};
