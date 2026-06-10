import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { NotFoundError } from '@tamanu/errors';
import { COMMUNICATION_STATUSES, MFA_CHALLENGE_TYPES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import {
  getAbilityForUser,
  getPermissionsForRoles,
} from '@tamanu/shared/permissions/rolesToPermissions';

import { getRandomBase64String } from '../auth/utils';
import { getWebAuthnContext, requireMfaEnabled } from '../auth/mfa';
import { getDefaultFromAddress } from '../services/mailConfig';
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

    const [credentials, totpSecret, targetAbility, targetPermissions] = await Promise.all([
      WebAuthnCredential.findAll({ where: { userId: user.id }, order: [['createdAt', 'ASC']] }),
      TotpSecret.findOne({ where: { userId: user.id } }),
      getAbilityForUser(req.store.models, user),
      getPermissionsForRoles(req.store.models, user.role),
    ]);
    res.send({
      webauthn: credentials.map(credential => ({
        id: credential.id,
        friendlyName: credential.friendlyName,
        createdAt: credential.createdAt,
        lastUsedAt: credential.lastUsedAt,
        discoverable: credential.discoverable,
        userVerified: credential.userVerified,
      })),
      totp: {
        enrolled: Boolean(totpSecret),
        confirmed: Boolean(totpSecret?.confirmedAt),
        confirmedAt: totpSecret?.confirmedAt ?? null,
      },
      // whether the user could enrol on their own (write Mfa, same check as
      // the self-service endpoints) — invites exist for those who can't
      canSelfEnrol: targetAbility.can('write', 'Mfa'),
      // literal `require Mfa` rows, like the login policy (not the compiled
      // ability, so a manage-all wildcard doesn't read as required)
      mfaRequired: targetPermissions.some(
        permission => permission.verb === 'require' && permission.noun === 'Mfa',
      ),
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

    await TotpSecret.sequelize.transaction(async () => {
      // soft: the tombstones must sync out so other servers stop accepting
      // the credentials
      await WebAuthnCredential.destroy({ where: { userId: user.id } });
      // hard: central-only table with no sync to inform, and a lingering
      // soft-deleted row would block re-enrolment on the unique user_id index
      await TotpSecret.destroy({ where: { userId: user.id }, force: true });
      // and the synced mirror of confirmation state
      await req.store.models.User.update(
        { totpConfirmedAt: null },
        { where: { id: user.id } },
      );
    });
    res.send({ ok: 'ok' });
  }),
);

// Remove a single passkey — the granular alternative to a full reset, for when
// a user loses one device but keeps others (or an old credential should be
// retired). Soft delete: the tombstone must sync out so other servers stop
// accepting the credential.
userMfaRouter.delete(
  '/webauthn/:credentialId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    const user = await targetUser(req);
    const { WebAuthnCredential } = req.store.models;

    const deleted = await WebAuthnCredential.destroy({
      where: { id: req.params.credentialId, userId: user.id },
    });
    if (!deleted) throw new NotFoundError('No such passkey');
    res.send({ ok: 'ok' });
  }),
);

// Issue an enrolment invite: a single-use, short-lived token the user redeems
// on their own device (with their password — never the token alone) to enrol
// without holding `write Mfa` themselves. Any channel is fine for delivering
// the token — including email — because the redeem step requiring the password
// is what makes interception insufficient. With `sendEmail` the server mails
// it to the user directly, with instructions; otherwise the token is returned
// for the admin to pass on however suits.
const enrolInviteSchema = yup.object({
  sendEmail: yup.boolean().default(false),
});

const inviteEmailText = ({ user, token, expiresAt }) => `
      Hi ${user.displayName},

      An administrator has invited you to set up multi-factor authentication
      (MFA) for your Tamanu account.

      To set it up:

      1. On your own device, open the Tamanu log-in screen.
      2. Follow the "Have an MFA enrolment invite?" link.
      3. Enter your email address, your password, and this invite token:

      ${token}

      4. Set up a passkey or an authenticator app when prompted.

      The invite can only be used once and expires at ${expiresAt.toISOString()}.
      If you weren't expecting this, please ignore this email and let your
      administrator know.

      tamanu.io`;

userMfaRouter.post(
  '/enrolInvite',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'UserMfa');
    await requireMfaEnabled(req);
    const user = await targetUser(req);
    const { sendEmail } = await enrolInviteSchema.validate(req.body ?? {});

    const expiryMinutes = await req.settings.get('auth.mfa.enrolInvite.expiry');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const token = await getRandomBase64String(ENROL_INVITE_TOKEN_LENGTH, 'base64url');

    await req.store.models.MfaChallenge.create({
      type: MFA_CHALLENGE_TYPES.ENROL_INVITE,
      token,
      userId: user.id,
      expiresAt,
    });

    if (sendEmail) {
      const result = await req.emailService.sendEmail({
        from: getDefaultFromAddress(),
        to: user.email,
        subject: 'Tamanu multi-factor authentication invite',
        text: inviteEmailText({ user, token, expiresAt }),
      });
      if (result.status !== COMMUNICATION_STATUSES.SENT) {
        log.error(`MFA enrol invite: email error: ${result.error}`);
        throw new Error('Could not send the invite email');
      }
      // emailed invites never disclose the token to the admin
      res.send({ expiresAt, sentTo: user.email });
      return;
    }

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
    const { rpId, residentKey, userVerification } = await getWebAuthnContext(req);
    const user = await targetUser(req);

    // in-person provisioning lands the passkey on the USER's device via the
    // QR/hybrid flow, never the admin's own authenticator
    const options = await beginWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user,
      residentKey,
      userVerification,
      preferredAuthenticatorType: 'remoteDevice',
    });
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
    const { rpId, userVerification } = await getWebAuthnContext(req);
    const user = await targetUser(req);

    const { registrationResponse, friendlyName } = await registerFinishSchema.validate(req.body);
    const credential = await finishWebAuthnRegistration({
      models: req.store.models,
      rpId,
      user,
      registrationResponse,
      friendlyName,
      userVerification,
    });
    res.send({ id: credential.id, friendlyName: credential.friendlyName });
  }),
);
