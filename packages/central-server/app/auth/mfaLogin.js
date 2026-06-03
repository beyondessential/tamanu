import { createSecretKey } from 'node:crypto';
import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as jose from 'jose';
import * as yup from 'yup';

import { JWT_TOKEN_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { ForbiddenError, InvalidTokenError } from '@tamanu/errors';
import {
  beginWebAuthnAssertion,
  beginWebAuthnRegistration,
  finishWebAuthnAssertion,
  finishWebAuthnRegistration,
} from '@tamanu/shared/auth/webauthnCeremonies';

import { sendLoginSuccessResponse } from './login';
import {
  getWebAuthnContext,
  requireMfaEnabled,
  requireTotpAvailable,
  resolveLoginMfaPolicy,
} from './mfa';
import { confirmTotp, enrolTotp, verifyTotp } from './totp';

/**
 * Completing a login that the MFA policy paused. Every endpoint takes the
 * short-lived mfa_login token (in the body, so facility servers can forward
 * these requests verbatim) that /login returned alongside `mfaPending`, and
 * the successful terminal ones answer with the full login payload.
 *
 * The pending token's `kind` scopes what it can do:
 * - challenge: present an existing factor (TOTP code, or a passkey assertion).
 * - enrol: forced enrolment — run an enrolment ceremony instead; completing it
 *   finishes the login, since the user has just proven possession of the
 *   brand-new factor.
 */

export const mfaLogin = express.Router();

const pendingFromBody = async req => {
  const mfaToken = req.body?.mfaToken;
  if (typeof mfaToken !== 'string' || !mfaToken) {
    throw new InvalidTokenError('Missing MFA login token');
  }

  let payload;
  try {
    ({ payload } = await jose.jwtVerify(
      mfaToken,
      createSecretKey(new TextEncoder().encode(config.auth.secret)),
      { issuer: config.canonicalHostName, audience: JWT_TOKEN_TYPES.MFA_LOGIN },
    ));
  } catch (_err) {
    throw new InvalidTokenError('Invalid or expired MFA login token');
  }

  const user = await req.store.models.User.findByPk(payload.userId);
  // users are rarely deleted but are routinely deactivated via
  // visibility_status; either way the account can no longer authenticate, and
  // completion is the second half of a login. Same message as a verification
  // failure: needn't reveal the account's state
  if (!user || user.visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
    throw new InvalidTokenError('Invalid or expired MFA login token');
  }
  return { user, payload };
};

const requireKind = (payload, kind) => {
  if (payload.kind !== kind) {
    // a challenge must be answered with an existing factor; enrolment is only
    // open when the policy asked for it
    throw new ForbiddenError(`This login requires ${payload.kind}, not ${kind}`);
  }
};

/**
 * Frontend settings were part of the original login response; recompute them
 * for completions that asked for them.
 */
const userSettingsFor = async (req, payload) =>
  payload.withSettings ? await req.settings.getFrontEndSettings() : undefined;

// Skip a forced enrolment without enrolling. Only succeeds when the policy,
// re-evaluated now, genuinely allows it (an IP-exempt required user): the
// interstitial is a nudge there, not a gate. The pending token's kind is not
// trusted — the live decision is — so this can never be used to bypass a real
// requirement. (Until IP-exemption ships, this always refuses.)
mfaLogin.post(
  '/skip',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);

    const decision = await resolveLoginMfaPolicy(req, user);
    if (!(decision.kind === 'enrol' && decision.skippable)) {
      throw new ForbiddenError('Enrolment cannot be skipped');
    }

    await sendLoginSuccessResponse(res, {
      models: req.store.models,
      user,
      deviceId: payload.deviceId,
      internalClient: payload.internalClient,
      userSettings: await userSettingsFor(req, payload),
    });
  }),
);

const totpVerifySchema = yup.object({
  mfaToken: yup.string().required(),
  code: yup.string().required(),
});

mfaLogin.post(
  '/totp',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'challenge');
    await requireTotpAvailable(req);

    const { code } = await totpVerifySchema.validate(req.body);
    await verifyTotp({ models: req.store.models, user, code });

    await sendLoginSuccessResponse(res, {
      models: req.store.models,
      user,
      deviceId: payload.deviceId,
      internalClient: payload.internalClient,
      userSettings: await userSettingsFor(req, payload),
    });
  }),
);

mfaLogin.post(
  '/webauthn/assert-begin',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'challenge');
    const { rpId } = await getWebAuthnContext(req);

    const options = await beginWebAuthnAssertion({ models: req.store.models, rpId, user });
    res.send(options);
  }),
);

const assertFinishSchema = yup.object({
  mfaToken: yup.string().required(),
  assertionResponse: yup.object().required(),
});

mfaLogin.post(
  '/webauthn/assert-finish',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'challenge');
    const { rpId } = await getWebAuthnContext(req);

    const { assertionResponse } = await assertFinishSchema.validate(req.body);
    const credential = await finishWebAuthnAssertion({
      models: req.store.models,
      rpId,
      assertionResponse,
    });
    if (credential.userId !== user.id) {
      throw new InvalidTokenError('Passkey does not belong to this login');
    }

    await sendLoginSuccessResponse(res, {
      models: req.store.models,
      user,
      deviceId: payload.deviceId,
      internalClient: payload.internalClient,
      userSettings: await userSettingsFor(req, payload),
    });
  }),
);

// ----- forced enrolment: the policy found nothing usable, so the login can
// only proceed by setting a factor up -----

mfaLogin.post(
  '/webauthn/register-begin',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'enrol');
    const { rpId } = await getWebAuthnContext(req);

    const options = await beginWebAuthnRegistration({ models: req.store.models, rpId, user });
    res.send(options);
  }),
);

const registerFinishSchema = yup.object({
  mfaToken: yup.string().required(),
  registrationResponse: yup.object().required(),
  friendlyName: yup.string().nullable(),
});

mfaLogin.post(
  '/webauthn/register-finish',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'enrol');
    const { rpId } = await getWebAuthnContext(req);

    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user,
      registrationResponse,
      friendlyName,
    });

    await sendLoginSuccessResponse(res, {
      models: req.store.models,
      user,
      deviceId: payload.deviceId,
      internalClient: payload.internalClient,
      userSettings: await userSettingsFor(req, payload),
    });
  }),
);

mfaLogin.post(
  '/totp/enrol',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'enrol');
    await requireTotpAvailable(req);

    const { otpauthUrl } = await enrolTotp({ models: req.store.models, user });
    res.send({ otpauthUrl });
  }),
);

const totpConfirmSchema = yup.object({
  mfaToken: yup.string().required(),
  code: yup.string().required(),
});

mfaLogin.post(
  '/totp/confirm',
  asyncHandler(async (req, res) => {
    await requireMfaEnabled(req);
    const { user, payload } = await pendingFromBody(req);
    requireKind(payload, 'enrol');
    await requireTotpAvailable(req);

    const { code } = await totpConfirmSchema.validate(req.body);
    await confirmTotp({ models: req.store.models, user, code });

    await sendLoginSuccessResponse(res, {
      models: req.store.models,
      user,
      deviceId: payload.deviceId,
      internalClient: payload.internalClient,
      userSettings: await userSettingsFor(req, payload),
    });
  }),
);
