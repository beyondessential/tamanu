import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import config from 'config';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import * as yup from 'yup';
import moment from 'moment';
import { ValidationError } from 'yup';

import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import { log } from 'shared/services/logging';
import { COMMUNICATION_STATUSES } from 'shared/constants';

import { getLocalisation } from '../localisation';
import { convertFromDbRecord, convertToDbRecord } from '../convertDbRecord';
import { sendEmail } from '../services/EmailService';

export const authMiddleware = express.Router();

export const getToken = async (user, expiry) => {
  return jwt.sign({ userId: user.id }, JWT_SECRET);
};

const JWT_SECRET = config.auth.secret || uuid();
const FAKE_TOKEN = 'fake-token';

const stripUser = user => {
  const { password, ...userData } = user;
  return userData;
};

authMiddleware.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { email, password } = body;

    if (!email && !password) {
      if (!config.auth.allowDummyToken) {
        throw new BadAuthenticationError('Missing credentials');
      }

      // send a token for the initial user
      const initialUser = await store.findUser(config.auth.initialUser.email);
      if (!initialUser) {
        throw new BadAuthenticationError('No such user');
      }
      res.send({
        token: FAKE_TOKEN,
        user: convertFromDbRecord(stripUser(initialUser)).data,
      });
      return;
    }

    const user = await store.findUser(email);

    if (!user && config.auth.reportNoUserError) {
      // an attacker can use this to get a list of user accounts
      // but hiding this error entirely can make debugging a hassle
      // so we just put it behind a config flag
      throw new BadAuthenticationError('No such user');
    }

    const hashedPassword = user?.password || '';

    if (!(await bcrypt.compare(password, hashedPassword))) {
      throw new BadAuthenticationError('Invalid credentials');
    }

    const token = await getToken(user);
    const localisation = await getLocalisation();

    // TODO: supports versions desktop-1.2.0/mobile-1.2.14 and older, remove once we no longer support these
    const featureFlags = {
      patientFieldOverrides: {
        displayId: {
          shortLabel: 'NHN',
          longLabel: 'National Health Number',
          hidden: false,
        },
      },
    };

    res.send({
      token,
      featureFlags,
      localisation,
      user: convertFromDbRecord(stripUser(user)).data,
    });
  }),
);

authMiddleware.post(
  '/resetPassword',
  asyncHandler(async (req, res) => {
    const { store, body } = req;

    const { models } = store;

    const schema = yup.object({
      email: yup
        .string()
        .email('Must enter a valid email')
        .required(),
    });

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

authMiddleware.post(
  '/changePassword',
  asyncHandler(async (req, res) => {
    const { store, body } = req;

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

    await schema.validate(body);

    await doChangePassword(store, body);

    res.send({ ok: 'ok' });
  }),
);

authMiddleware.use(
  asyncHandler(async (req, res, next) => {
    const { store, headers } = req;

    // get token
    const { authorization } = headers;
    if (!authorization) {
      throw new ForbiddenError();
    }

    // verify token
    const [bearer, token] = authorization.split(/\s/);
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadAuthenticationError('Only Bearer token is supported');
    }

    if (config.auth.allowDummyToken && token === FAKE_TOKEN) {
      req.user = await store.findUser(config.auth.initialUser.email);
      next();
      return;
    }

    let contents = null;
    try {
      contents = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      throw new BadAuthenticationError('Invalid token');
    }

    const { userId } = contents;

    const user = await store.findUserById(userId);

    if (!user) {
      throw new BadAuthenticationError(`User specified in token (${userId}) does not exist`);
    }

    req.user = stripUser(user);

    next();
  }),
);

authMiddleware.get(
  '/whoami',
  asyncHandler((req, res) => {
    res.send(convertFromDbRecord(req.user).data);
  }),
);

// TODO: remove this hack once we've verified nothing needs to upsert new or existing users
authMiddleware.post(
  '/upsertUser',
  asyncHandler(async (req, res) => {
    const requestedAt = Date.now();
    const { store, body } = req;
    await store.upsert('user', convertToDbRecord(body));
    res.send({ count: 1, requestedAt });
  }),
);

const createResetCodeToken = (length = 6) => {
  let token = '';
  for (let i = 0; i < length; i++) {
    token += Math.floor(Math.random() * 9) + 1;
  }
  return token;
};

const createOneTimeLogin = async (models, user) => {
  const token = createResetCodeToken();

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
