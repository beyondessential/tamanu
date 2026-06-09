import { createSecretKey } from 'node:crypto';
import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as jose from 'jose';
import * as yup from 'yup';
import { Op } from 'sequelize';
import { compare } from 'bcrypt';

import { JWT_TOKEN_TYPES, MFA_CHALLENGE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidTokenError } from '@tamanu/errors';
import {
  beginWebAuthnRegistration,
  finishWebAuthnRegistration,
} from '@tamanu/shared/auth/webauthnCeremonies';

import { buildToken } from './utils';
import { getWebAuthnContext, requireMfaEnabled, requireTotpAvailable } from './mfa';
import { confirmTotp, enrolTotp } from './totp';

/**
 * Redeeming an admin-issued MFA enrolment invite, and the enrolment ceremonies
 * it unlocks. Mounted pre-auth (with the auth rate limiter): the user isn't
 * logged in — possession of the invite token AND their password stands in for
 * a session, and the admin's `write UserMfa` (which minted the invite) stands
 * in for `write Mfa`.
 *
 * The token alone is never sufficient. An invite is a bearer authorisation to
 * attach an authenticator to an account, so an intercepted one would otherwise
 * let an attacker enrol their own passkey — requiring the password closes
 * that off.
 *
 * Redemption trades the (single-use) invite for a short-lived JWT scoped to
 * these endpoints only (audience mfa_enrol) — enough to complete a multi-step
 * ceremony without re-sending the password each round trip. Like the
 * mfa/login pending pass, the session token travels in the request BODY
 * (`enrolToken`), not the Authorization header: facility servers forward
 * these requests to central, and forwarding replaces the Authorization
 * header with the facility's own central session.
 */

const ENROL_SESSION_EXPIRY = '15 minutes';

const redeemSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
  token: yup.string().required(),
});

export const enrolInvite = express.Router();

enrolInvite.post(
  '/redeem',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { models } = req.store;
    const { email, password, token } = await redeemSchema.validate(req.body);

    // single error for every failure mode: don't leak which of the token,
    // email, or password was wrong
    const fail = () => {
      throw new InvalidTokenError('Invalid or expired enrolment invite');
    };

    const user = await models.User.getForAuthByEmail(email);
    if (!user) fail();

    // brute-forcing the password here requires a live invite in hand, and the
    // route sits behind the auth rate limiter. Checked before claiming so a
    // wrong password doesn't burn the invite.
    if (!(await compare(password, user.password ?? ''))) fail();

    // claim the invite atomically: a single UPDATE that only matches a live,
    // unused, unexpired row, so two concurrent redemptions can't both win
    // (returning the row count is the single-use guarantee — a findOne+update
    // pair would race)
    const [claimedCount] = await models.MfaChallenge.update(
      { usedAt: new Date() },
      {
        where: {
          type: MFA_CHALLENGE_TYPES.ENROL_INVITE,
          token,
          userId: user.id,
          usedAt: null,
          expiresAt: { [Op.gt]: new Date() },
        },
      },
    );
    if (claimedCount === 0) fail();

    const enrolToken = await buildToken({ userId: user.id }, config.auth.secret, {
      issuer: config.canonicalHostName,
      audience: JWT_TOKEN_TYPES.MFA_ENROL,
      expiresIn: ENROL_SESSION_EXPIRY,
    });
    res.send({
      token: enrolToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  }),
);

// Everything below requires the enrol-session token from /redeem — a normal
// login session is neither needed nor accepted.
const enrolSessionMiddleware = asyncHandler(async (req, _res, next) => {
  const enrolToken = req.body?.enrolToken;
  if (typeof enrolToken !== 'string' || !enrolToken) {
    throw new InvalidTokenError('Missing enrolment session token');
  }

  let payload;
  try {
    ({ payload } = await jose.jwtVerify(
      enrolToken,
      createSecretKey(new TextEncoder().encode(config.auth.secret)),
      { issuer: config.canonicalHostName, audience: JWT_TOKEN_TYPES.MFA_ENROL },
    ));
  } catch (_err) {
    throw new InvalidTokenError('Invalid or expired enrolment session');
  }

  const user = await req.store.models.User.findByPk(payload.userId);
  // deactivation (visibility_status) is how users are retired in practice;
  // a deactivated user must not keep an enrolment session either. Same class
  // and message as a verification failure: don't differentiate
  if (!user || user.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
    throw new InvalidTokenError('Invalid or expired enrolment session');
  }
  // eslint-disable-next-line require-atomic-updates
  req.user = user;
  next();
});

enrolInvite.use(enrolSessionMiddleware);

enrolInvite.post(
  '/webauthn/register-begin',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { rpId, residentKey } = await getWebAuthnContext(req);
    const options = await beginWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user: req.user,
      residentKey,
    });
    res.send(options);
  }),
);

const registerFinishSchema = yup.object({
  registrationResponse: yup.object().required(),
  friendlyName: yup.string().nullable(),
});

enrolInvite.post(
  '/webauthn/register-finish',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { rpId } = await getWebAuthnContext(req);
    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    const credential = await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user: req.user,
      registrationResponse,
      friendlyName,
    });
    res.send({ id: credential.id, friendlyName: credential.friendlyName });
  }),
);

enrolInvite.post(
  '/totp/enrol',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    await requireTotpAvailable(req);
    const { otpauthUrl } = await enrolTotp({ models: req.store.models, user: req.user });
    res.send({ otpauthUrl });
  }),
);

const totpConfirmSchema = yup.object({
  code: yup.string().required(),
});

enrolInvite.post(
  '/totp/confirm',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    await requireTotpAvailable(req);
    const { code } = await totpConfirmSchema.validate(req.body);
    await confirmTotp({ models: req.store.models, user: req.user, code });
    res.send({ ok: 'ok' });
  }),
);
