import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import config from 'config';

import { MFA_PASSWORDLESS } from '@tamanu/constants';
import { ForbiddenError, InvalidCredentialError } from '@tamanu/errors';
import { effectivePasswordlessMode } from '@tamanu/shared/auth/mfaPolicy';
import {
  beginWebAuthnAssertion,
  finishWebAuthnAssertion,
} from '@tamanu/shared/auth/webauthnCeremonies';
import { log } from '@tamanu/shared/services/logging';

import { getWebAuthnContext, resolveLoginMfaPolicy } from './mfa';
import { assertIpAllowed, resolveClientIp } from './clientIp';
import { sendLoginSuccessResponse } from './login';

/**
 * Passwordless login: a user-verifying passkey assertion as the complete
 * login, no password. UV (biometric/PIN, enforced by the shared ceremony's
 * requireUserVerification) makes the assertion possession + inherence, so the
 * policy counts it as fully authenticated — no second factor.
 *
 * The ceremony is usernameless: the begin step issues a challenge with no
 * allowCredentials (discoverable credentials), and the finish step learns who
 * is logging in from the credential the authenticator answers with.
 *
 * Gated server-side by `auth.mfa.passwordless`: `off` rejects assertions
 * outright; `onRequest` and `promoted` differ only in client presentation.
 */

const requirePasswordlessAvailable = async req => {
  const mode = await effectivePasswordlessMode({
    settings: req.settings,
    origin: config.canonicalHostName,
  });
  if (mode === MFA_PASSWORDLESS.OFF) {
    throw new ForbiddenError('Passwordless login is not available');
  }
  return getWebAuthnContext(req);
};

export const passwordlessLogin = express.Router();

passwordlessLogin.post(
  '/assert-begin',
  asyncHandler(async (req, res) => {
    await assertIpAllowed(req, await resolveClientIp(req));
    const { rpId } = await requirePasswordlessAvailable(req);
    // no user: discoverable-credential ceremony, the authenticator picks
    const options = await beginWebAuthnAssertion({ models: req.store.models, rpId });
    res.send(options);
  }),
);

const assertFinishSchema = yup.object({
  assertionResponse: yup.object().required(),
  deviceId: yup.string().nullable(),
  facilityIds: yup.array().of(yup.string()).nullable(),
});

passwordlessLogin.post(
  '/assert-finish',
  asyncHandler(async (req, res) => {
    await assertIpAllowed(req, await resolveClientIp(req));
    const { rpId } = await requirePasswordlessAvailable(req);
    const { models } = req.store;
    const { assertionResponse, deviceId, facilityIds } = await assertFinishSchema.validate(
      req.body,
    );

    const credential = await finishWebAuthnAssertion({ models, rpId, assertionResponse });
    const user = await models.User.findByPk(credential.userId);
    if (!user) {
      // the credential outlived its user somehow; same class as a bad assertion
      throw new InvalidCredentialError('Passkey assertion could not be verified');
    }

    // a UV passkey assertion satisfies the policy outright; evaluated anyway
    // so every login flows through the same decision point
    const decision = await resolveLoginMfaPolicy(req, user, { authMethod: 'webauthn' });
    if (decision.kind !== 'none') {
      // cannot happen with authMethod webauthn; belt-and-braces over a silent
      // policy bypass if that ever changes
      throw new ForbiddenError('Multi-factor authentication is required');
    }

    const {
      device,
      internalClient,
      settings: userSettings,
    } = await models.User.loginFromVerifiedPasskey(
      {
        user,
        deviceId,
        facilityIds,
        clientHeader: req.header('X-Tamanu-Client'),
      },
      { settings: req.settings },
    );

    log.info(`Passwordless login: ${user.id}`);
    await sendLoginSuccessResponse(res, {
      models,
      user,
      deviceId: device?.id,
      internalClient,
      userSettings,
    });
  }),
);
