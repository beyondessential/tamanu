import express from 'express';
import asyncHandler from 'express-async-handler';
// TODO: use db fetcher config?
import config from 'config';
import * as yup from 'yup';
import { addMinutes } from 'date-fns';

import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { findUser, getRandomBase64String } from './utils';

export const resetPassword = express.Router();

const schema = yup.object({
  email: yup
    .string()
    .email('Must enter a valid email')
    .required(),
});

resetPassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { store, body } = req;

    const { models } = store;

    await schema.validate(body);

    const { email } = body;

    const user = await findUser(models, email);

    if (!user) {
      log.info(`Password reset request: No user found with email ${email}`);
      // An attacker could use this to get a list of user accounts
      // so we return the same ok result
    } else {
      const token = await createOneTimeLogin(models, user);
      await sendResetEmail(req.emailService, user, token);
    }

    return res.send({ ok: 'ok' });
  }),
);

const createOneTimeLogin = async (models, user) => {
  const token = await getRandomBase64String(config.auth.resetPassword.tokenLength);

  const expiresAt = addMinutes(new Date(), config.auth.resetPassword.tokenExpiry);

  await models.OneTimeLogin.create({
    userId: user.id,
    token,
    expiresAt,
  });

  return token;
};

const sendResetEmail = async (emailService, user, token) => {
  const emailText = `
      Hi ${user.displayName},

      You are receiving this email because someone requested a password reset for
      this user account. To reset your password enter the following reset code into Tamanu.

      Reset Code: ${token}

      If you believe this was sent to you in error, please ignore this email.

      tamanu.io`;

  const result = await emailService.sendEmail({
    from: config.mailgun.from,
    to: user.email,
    subject: 'Tamanu password reset',
    text: emailText,
  });
  if (result.status === COMMUNICATION_STATUSES.SENT) {
    log.info(`Password reset request: Sent email to ${user.email}`);
  } else {
    log.error(`Password reset request: Mailgun error: ${result.error}`);

    // Small security hole but worth it IMO for the user experience - if the email cannot
    // be sent this exposes that a user exists with the given email address, but
    // only when we get a mailgun connection error, so not very often hopefully.
    throw new Error(`Email could not be sent`);
  }
};
