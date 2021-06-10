import express from 'express';
import asyncHandler from 'express-async-handler';
import { log } from 'shared/services/logging';
import * as yup from 'yup';
import { ValidationError } from 'yup';
import moment from 'moment';

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

// check for pending changes across a batch of channels
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

  // An attacker could use !user to get a list of user accounts
  // so we return the same result for !user and !token
  const userOrTokenNotFound = new ValidationError(`User or token not found`);

  const user = await store.findUser(email);

  if (!user) {
    log.info(`User with email ${email} not found`);
    throw userOrTokenNotFound;
  }

  const oneTimeLogin = await models.OneTimeLogin.findOne({
    where: { userId: user.id, token },
  });

  if (!oneTimeLogin) {
    log.info(`One time login with user ${user.id} and token ${token} not found`);
    throw userOrTokenNotFound;
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
