import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import * as yup from 'yup';

import { MFA_PASSWORDLESS } from '@tamanu/constants';
import { ForbiddenError, InvalidCredentialError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';
import { effectivePasswordlessMode } from '@tamanu/shared/auth/mfaPolicy';
import {
  beginWebAuthnAssertion,
  finishWebAuthnAssertion,
} from '@tamanu/shared/auth/webauthnCeremonies';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

import { sendFacilityLoginResponse } from '../../middleware/auth';

/**
 * Passwordless passkey login at a facility — fully local, by design: the
 * public keys sync here, the challenge lives in the local table, and the
 * gating settings sync too, so a user-verifying passkey logs in even with
 * central unreachable. Strictly better offline than password (which needs the
 * synced hash) + TOTP (which needs central).
 *
 * Pre-auth: the verified assertion is the credential.
 */

// matches the default in middleware/auth.js — facility configs may not set it
const { canonicalHostName = 'localhost' } = config;

// auth.mfa.* are global-schema settings; read with a plain global reader
const globalSettings = req => new ReadSettings(req.models);

const requirePasswordlessAvailable = async req => {
  const settings = globalSettings(req);
  const mode = await effectivePasswordlessMode({ settings, origin: canonicalHostName });
  if (mode === MFA_PASSWORDLESS.OFF) {
    throw new ForbiddenError('Passwordless login is not available');
  }
  const rpId = await settings.get('auth.mfa.webauthn.rpid');
  return { rpId, settings };
};

export const passwordlessLogin = express.Router();

passwordlessLogin.post(
  '/assert-begin',
  asyncHandler(async (req, res) => {
    // no permission needed: this IS the authentication step
    req.flagPermissionChecked();
    const { rpId } = await requirePasswordlessAvailable(req);

    // no user: discoverable-credential ceremony, the authenticator picks
    const options = await beginWebAuthnAssertion({ models: req.models, rpId });
    res.send(options);
  }),
);

const assertFinishSchema = yup.object({
  assertionResponse: yup.object().required(),
  deviceId: yup.string().nullable(),
});

passwordlessLogin.post(
  '/assert-finish',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { rpId, settings } = await requirePasswordlessAvailable(req);
    const { models } = req;
    const { assertionResponse, deviceId } = await assertFinishSchema.validate(req.body);

    const credential = await finishWebAuthnAssertion({ models, rpId, assertionResponse });
    const user = await models.User.findByPk(credential.userId);
    if (!user) {
      throw new InvalidCredentialError('Passkey assertion could not be verified');
    }

    const { device } = await models.User.loginFromVerifiedPasskey(
      { user, deviceId, clientHeader: req.header('X-Tamanu-Client') },
      { settings },
    );

    // same response shape as a central-down password login: everything is
    // sourced locally
    const loginResult = {
      central: false,
      user: user.get({ plain: true }),
      allowedFacilities: await user.allowedFacilities(),
      localisation: await models.UserLocalisationCache.getLocalisation({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
      }),
      primaryTimeZone: getPrimaryTimeZone(config),
    };
    await sendFacilityLoginResponse(req, res, { deviceId: device?.id, loginResult });
  }),
);
