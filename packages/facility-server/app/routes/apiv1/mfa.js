import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as yup from 'yup';

import { ForbiddenError, NotFoundError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';
import { originIsUnderRpId } from '@tamanu/shared/auth/webauthn';
import {
  beginWebAuthnRegistration,
  finishWebAuthnRegistration,
} from '@tamanu/shared/auth/webauthnCeremonies';

/**
 * Self-service MFA management for the logged-in user, facility flavour.
 *
 * WebAuthn ceremonies run fully locally — shared ceremony code against the
 * local tables, so in-zone enrolment works offline and the credential syncs
 * up. TOTP is deliberately absent: it is central-bound, and forwarding
 * authenticates as the facility's central user rather than the end user, so a
 * forwarded enrolment would act on the wrong account. Authenticator apps are
 * set up on central's webapp, via the login interstitial, or by admin invite.
 *
 * Mounted in the authenticated section, so req.user / req.checkPermission are
 * available; every route acts on req.user only, gated by `write Mfa`.
 */

// matches the default in middleware/auth.js — facility configs may not set it
const { canonicalHostName = 'localhost' } = config;

// req.settings on a facility is keyed by facility id; auth.mfa.* are
// global-schema settings, so read them with a plain global reader (cached)
const globalSettings = req => new ReadSettings(req.models);

const requireMfaEnabled = async req => {
  if (!(await globalSettings(req).get('auth.mfa.enabled'))) {
    throw new ForbiddenError('MFA is not enabled');
  }
};

/**
 * The rpid for locally-run WebAuthn ceremonies, or a ForbiddenError when this
 * facility's origin isn't under the configured rpid stem (out-of-zone — the
 * browser would refuse the ceremony anyway).
 */
const getWebAuthnContext = async req => {
  const rpId = await globalSettings(req).get('auth.mfa.webauthn.rpid');
  if (!originIsUnderRpId(canonicalHostName, rpId)) {
    throw new ForbiddenError('WebAuthn is not available on this server');
  }
  return { rpId };
};

const credentialSummary = credential => ({
  id: credential.id,
  friendlyName: credential.friendlyName,
  transports: credential.transports,
  createdAt: credential.createdAt,
  lastUsedAt: credential.lastUsedAt,
});

export const mfa = express.Router();

mfa.post(
  '/webauthn/register-begin',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);
    const { rpId } = await getWebAuthnContext(req);

    const options = await beginWebAuthnRegistration({
      models: req.models,
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
      models: req.models,
      rpId,
      user: req.user,
      registrationResponse,
      friendlyName,
    });
    res.send(credentialSummary(credential));
  }),
);

mfa.get(
  '/methods',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);

    // passkeys sync, so the local table is the full set; TOTP state is
    // central-only and unknowable here — null tells the client it's managed
    // centrally, not that it's absent
    const credentials = await req.models.WebAuthnCredential.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
    });
    res.send({
      webauthn: credentials.map(credentialSummary),
      totp: null,
    });
  }),
);

mfa.delete(
  '/webauthn/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Mfa');
    await requireMfaEnabled(req);

    // soft delete: the tombstone has to sync out so other servers stop
    // accepting the credential
    const deleted = await req.models.WebAuthnCredential.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) throw new NotFoundError('No such passkey');
    res.send({ ok: 'ok' });
  }),
);
