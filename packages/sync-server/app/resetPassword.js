import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { COMMUNICATION_STATUSES } from 'shared/constants';
import { log } from 'shared/services/logging';
import * as yup from 'yup';
import moment from 'moment';
import { sendEmail } from './services/EmailService';

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

    const user = await store.findUser(email);

    if (!user) {
      log.info(`Password reset request: No user found with email ${email}`);
      // An attacker could use this to get a list of user accounts
      // so we return the same ok result
    } else {
      const token = await createOneTimeLogin(models, user);
      await sendResetEmail(user, token);
    }

    return res.send({ ok: 'ok' });
  }),
);

const createToken = (length = 6) => {
  let token = '';
  for (let i = 0; i < length; i++) {
    token += Math.floor(Math.random() * 9) + 1;
  }
  return token;
};

const createOneTimeLogin = async (models, user) => {
  const token = createToken();

  const expiresAt = moment()
    .add(20, 'minutes')
    .toDate();

  await models.OneTimeLogin.create({
    userId: user.id,
    token,
    expiresAt,
  });

  return token;
};

const sendResetEmail = async (user, token) => {
  const emailText = `
      Hi ${user.displayName},
      
      You are receiving this email because someone requested a password reset for
      this user account. To reset your password enter the following reset code into Tamanu.
  
      Reset Code: ${token}
  
      If you believe this was sent to you in error, please ignore this email.
      
      tamanu.io`;

  const result = await sendEmail({
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
