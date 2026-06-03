import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as yup from 'yup';

import { ForbiddenError, NotFoundError } from '@tamanu/errors';
import { constructPermission, ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { isTotpAvailable } from '@tamanu/shared/auth/mfaPolicy';
import { originIsUnderRpId } from '@tamanu/shared/auth/webauthn';
import {
  beginWebAuthnRegistration,
  finishWebAuthnRegistration,
} from '@tamanu/shared/auth/webauthnCeremonies';

import { confirmTotp, enrolTotp } from './totp';

/**
 * Self-service MFA management for the logged-in user. Mounted behind
 * userMiddleware; every route acts on req.user only, gated by `write Mfa`.
 *
 * The assertion (login challenge) endpoints are not here — they run pre-auth
 * as part of the login flow.
 */

export async function requireMfaEnabled(req) {
  if (!(await req.settings.get('auth.mfa.enabled'))) {
    throw new ForbiddenError('MFA is not enabled');
  }
}

/**
 * The rpid and expected web origin for WebAuthn ceremonies run against this
 * server, or a ForbiddenError when this server's origin isn't under the
 * configured rpid stem (the browser would refuse the ceremony anyway).
 */
export async function getWebAuthnContext(req) {
  const rpId = await req.settings.get('auth.mfa.webauthn.rpid');
  if (!originIsUnderRpId(config.canonicalHostName, rpId)) {
    throw new ForbiddenError('WebAuthn is not available on this server');
  }
  return { rpId, expectedOrigin: new URL(config.canonicalHostName).origin };
}

/**
 * TOTP availability beyond the master flag: `off` disables it, and
 * `fallbackOnly` reserves it for surfaces where WebAuthn can't run — which on
 * a WebAuthn-capable server means enrolment is refused and users are steered
 * to passkeys instead.
 */
async function requireTotpAvailable(req) {
  const totpAvailability = await req.settings.get('auth.mfa.totp.availability');
  const rpId = await req.settings.get('auth.mfa.webauthn.rpid');
  const available = isTotpAvailable({
    totpAvailability,
    webAuthnAvailable: originIsUnderRpId(config.canonicalHostName, rpId),
    centralReachable: true, // we are central
  });
  if (!available) {
    throw new ForbiddenError('Authenticator app codes are not available on this server');
  }
}

const credentialSummary = credential => ({
  id: credential.id,
  friendlyName: credential.friendlyName,
  transports: credential.transports,
  createdAt: credential.createdAt,
  lastUsedAt: credential.lastUsedAt,
});

export const mfa = express.Router();

// authModule is mounted before the api-wide constructPermission, so build the
// ability here ourselves
mfa.use(constructPermission);
mfa.use(ensurePermissionCheck);

mfa.post(
  '/webauthn/register-begin',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    const { rpId } = await getWebAuthnContext(req);

    const options = await beginWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user: req.user,
    });
    res.send(options);
  }),
);

const registerFinishSchema = yup.object({
  registrationResponse: yup.object().required(),
  friendlyName: yup.string().nullable(),
});

mfa.post(
  '/webauthn/register-finish',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    const { rpId, expectedOrigin } = await getWebAuthnContext(req);

    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    const credential = await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
      expectedOrigin,
      user: req.user,
      registrationResponse,
      friendlyName,
    });
    res.send(credentialSummary(credential));
  }),
);

mfa.post(
  '/totp/enrol',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    await requireTotpAvailable(req);

    const { otpauthUrl } = await enrolTotp({ models: req.store.models, user: req.user });
    res.send({ otpauthUrl });
  }),
);

const totpConfirmSchema = yup.object({
  code: yup.string().required(),
});

mfa.post(
  '/totp/confirm',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    await requireTotpAvailable(req);

    const { code } = await totpConfirmSchema.validate(req.body);
    await confirmTotp({ models: req.store.models, user: req.user, code });
    res.send({ ok: 'ok' });
  }),
);

mfa.get(
  '/methods',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    const { WebAuthnCredential, TotpSecret } = req.store.models;

    const [credentials, totpSecret] = await Promise.all([
      WebAuthnCredential.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'ASC']] }),
      TotpSecret.findOne({ where: { userId: req.user.id } }),
    ]);
    res.send({
      webauthn: credentials.map(credentialSummary),
      totp: { enrolled: Boolean(totpSecret), confirmed: Boolean(totpSecret?.confirmedAt) },
    });
  }),
);

mfa.delete(
  '/webauthn/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    const { WebAuthnCredential } = req.store.models;

    // soft delete: the tombstone has to sync out so other servers stop
    // accepting the credential
    const deleted = await WebAuthnCredential.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) throw new NotFoundError('No such passkey');
    res.send({ ok: 'ok' });
  }),
);
