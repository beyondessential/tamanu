import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { NotFoundError } from '@tamanu/errors';
import { MFA_CHALLENGE_TYPES } from '@tamanu/constants';

import { getRandomBase64String } from '../auth/utils';
import { getWebAuthnContext, requireMfaEnabled } from '../auth/mfa';
import {
  beginWebAuthnRegistration,
  finishWebAuthnRegistration,
} from '@tamanu/shared/auth/webauthnCeremonies';

/**
 * Admin actions on another user's MFA, gated by the UserMfa permissions.
 * Mounted at /admin/users/:userId/mfa.
 *
 * The target user needs no MFA permission of their own for any of these: the
 * admin's `write UserMfa` is the authority, and for the invite token it
 * travels with the token to the user's own device.
 */

const ENROL_INVITE_TOKEN_LENGTH = 32;

export const userMfaRouter = express.Router({ mergeParams: true });

async function targetUser(req) {
  const user = await req.store.models.User.findByPk(req.params.userId);
  if (!user) throw new NotFoundError('No such user');
  return user;
}

userMfaRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'UserMfa');
    const user = await targetUser(req);
    const { WebAuthnCredential, TotpSecret } = req.store.models;

    const [credentials, totpSecret] = await Promise.all([
      WebAuthnCredential.findAll({ where: { userId: user.id }, order: [['createdAt', 'ASC']] }),
      TotpSecret.findOne({ where: { userId: user.id } }),
    ]);
    res.send({
      webauthn: credentials.map(credential => ({
        id: credential.id,
        friendlyName: credential.friendlyName,
        createdAt: credential.createdAt,
        lastUsedAt: credential.lastUsedAt,
      })),
      totp: { enrolled: Boolean(totpSecret), confirmed: Boolean(totpSecret?.confirmedAt) },
    });
  }),
);

// Reset: clear every factor so the user can re-enrol — the recovery path for a
// locked-out user (there are no recovery codes).
userMfaRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    const user = await targetUser(req);
    const { WebAuthnCredential, TotpSecret } = req.store.models;

    await Promise.all([
      // soft: the tombstones must sync out so other servers stop accepting
      // the credentials
      WebAuthnCredential.destroy({ where: { userId: user.id } }),
      // hard: central-only table with no sync to inform, and a lingering
      // soft-deleted row would block re-enrolment on the unique user_id index
      TotpSecret.destroy({ where: { userId: user.id }, force: true }),
    ]);
    res.send({ ok: 'ok' });
  }),
);

// Issue an enrolment invite: a single-use, short-lived token the user redeems
// on their own device (with their password — never the token alone) to enrol
// without holding `write Mfa` themselves. How the token reaches the user is up
// to the admin (read out in person, sent through an existing channel); the
// redeem step requiring the password is what makes interception insufficient.
userMfaRouter.post(
  '/enrolInvite',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    await requireMfaEnabled(req);
    const user = await targetUser(req);

    const expiryMinutes = await req.settings.get('auth.mfa.enrolInvite.expiry');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const token = await getRandomBase64String(ENROL_INVITE_TOKEN_LENGTH, 'base64url');

    await req.store.models.MfaChallenge.create({
      type: MFA_CHALLENGE_TYPES.ENROL_INVITE,
      token,
      userId: user.id,
      expiresAt,
    });
    res.send({ token, expiresAt });
  }),
);

// In-person ("come to IT") provisioning over the hybrid transport: the admin
// runs the registration ceremony bound to the target user; the QR on the
// admin's screen is scanned by the user's own phone, which is where the
// passkey is created. The admin only ever relays the public attestation.
userMfaRouter.post(
  '/webauthn/register-begin',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    await requireMfaEnabled(req);
    const { rpId } = await getWebAuthnContext(req);
    const user = await targetUser(req);

    const options = await beginWebAuthnRegistration({ models: req.store.models, rpId, user });
    res.send(options);
  }),
);

const registerFinishSchema = yup.object({
  registrationResponse: yup.object().required(),
  friendlyName: yup.string().nullable(),
});

userMfaRouter.post(
  '/webauthn/register-finish',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    await requireMfaEnabled(req);
    const { rpId } = await getWebAuthnContext(req);
    const user = await targetUser(req);

    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    const credential = await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user,
      registrationResponse,
      friendlyName,
    });
    res.send({ id: credential.id, friendlyName: credential.friendlyName });
  }),
);
