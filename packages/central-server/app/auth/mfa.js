import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as yup from 'yup';

import { ForbiddenError, NotFoundError } from '@tamanu/errors';
import { constructPermission, ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { isTotpAvailable, resolveMfaPolicy } from '@tamanu/shared/auth/mfaPolicy';
import { originIsUnderRpId } from '@tamanu/shared/auth/webauthn';
import { getPermissionsForRoles } from '@tamanu/shared/permissions/rolesToPermissions';
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
 * The rpid for WebAuthn ceremonies run against this server, or a
 * ForbiddenError when this server's origin isn't under the configured rpid
 * stem (the browser would refuse the ceremony anyway). Ceremony origins are
 * validated against the stem inside the ceremony service, so verification
 * also accepts ceremonies forwarded from other in-zone frontends.
 */
export async function getWebAuthnContext(req) {
  const rpId = await req.settings.get('auth.mfa.webauthn.rpid');
  if (!originIsUnderRpId(config.canonicalHostName, rpId)) {
    throw new ForbiddenError('WebAuthn is not available on this server');
  }
  return { rpId };
}

/**
 * TOTP availability beyond the master flag: `off` disables it, and
 * `fallbackOnly` reserves it for surfaces where WebAuthn can't run — which on
 * a WebAuthn-capable server means enrolment is refused and users are steered
 * to passkeys instead.
 */
export async function requireTotpAvailable(req) {
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

/**
 * What this login owes beyond the password, per the shared policy function,
 * with all the central-server inputs filled in.
 *
 * `require Mfa` is matched against the role's literal permission rows rather
 * than the compiled ability, so a wildcard grant (`manage all`) doesn't
 * silently make every admin MFA-required.
 */
export async function resolveLoginMfaPolicy(req, user) {
  const { settings, store } = req;
  const mfaEnabled = await settings.get('auth.mfa.enabled');
  if (!mfaEnabled) return { kind: 'none' };

  const { WebAuthnCredential, TotpSecret } = store.models;
  const [totpAvailability, rpId, permissions, totpSecret] = await Promise.all([
    settings.get('auth.mfa.totp.availability'),
    settings.get('auth.mfa.webauthn.rpid'),
    getPermissionsForRoles(store.models, user.role),
    TotpSecret.findOne({ where: { userId: user.id } }),
  ]);
  // only credentials bound to the current rpid can assert; ones from an old
  // rpid are dead weight
  const credentialCount = rpId
    ? await WebAuthnCredential.count({ where: { userId: user.id, rpId } })
    : 0;

  return resolveMfaPolicy({
    mfaEnabled,
    totpAvailability,
    webAuthnAvailable: originIsUnderRpId(config.canonicalHostName, rpId),
    centralReachable: true, // we are central
    hasWebAuthnCredential: credentialCount > 0,
    hasConfirmedTotp: Boolean(totpSecret?.confirmedAt),
    mfaRequired: permissions.some(
      permission => permission.verb === 'require' && permission.noun === 'Mfa',
    ),
  });
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
    const { rpId } = await getWebAuthnContext(req);

    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    const credential = await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
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
      totp: {
        enrolled: Boolean(totpSecret),
        confirmed: Boolean(totpSecret?.confirmedAt),
        confirmedAt: totpSecret?.confirmedAt ?? null,
      },
    });
  }),
);

const renameSchema = yup.object({
  friendlyName: yup.string().trim().min(1).max(100).required(),
});

mfa.patch(
  '/webauthn/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);

    const { friendlyName } = await renameSchema.validate(req.body);
    const [updated] = await req.store.models.WebAuthnCredential.update(
      { friendlyName },
      { where: { id: req.params.id, userId: req.user.id } },
    );
    if (!updated) throw new NotFoundError('No such passkey');
    res.send({ ok: 'ok' });
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
