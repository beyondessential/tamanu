import * as OTPAuth from 'otpauth';

import { InvalidCredentialError } from '@tamanu/errors';
import {
  decryptSecret,
  encryptSecret,
  getSettingsPskKeyBuffer,
} from '@tamanu/shared/utils/crypto';

/**
 * TOTP seeds are symmetric secrets — anywhere one exists can mint valid codes —
 * so everything here runs on central only. Facilities forward entered codes
 * rather than ever holding a seed, and the totp_secrets table does not sync.
 *
 * At rest the seed is wrapped with the existing settings-secret envelope
 * (`S1:{iv}:{ciphertext}`, keyed by `crypto.settingsPsk`): defence-in-depth
 * against a database dump, while central-only storage carries the actual
 * blast-radius protection.
 *
 * Parameters are the authenticator-app defaults (SHA1, 6 digits, 30s) and are
 * deliberately not configurable: changing them silently breaks compatibility
 * with the apps users already have.
 */

const TOTP_ISSUER = 'Tamanu';
const VALIDATION_WINDOW = 1; // accept one period of clock drift either way

const buildTotp = (secret, label) =>
  new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label,
    secret,
  });

/**
 * Create (or replace) the user's pending TOTP seed and return the otpauth://
 * URI to show as a QR code. The seed only counts as a factor once confirmed.
 */
export async function enrolTotp({ models, user }) {
  const secret = new OTPAuth.Secret();
  const keyBuffer = await getSettingsPskKeyBuffer();
  const encrypted = await encryptSecret(keyBuffer, secret.base32);

  // one seed per user: re-enrolling replaces any previous seed, confirmed or
  // not, so a lost authenticator can be swapped out
  const row = await models.TotpSecret.sequelize.transaction(async () => {
    const [replacement] = await models.TotpSecret.upsert(
      { userId: user.id, secret: encrypted, confirmedAt: null },
      { conflictFields: ['user_id'] },
    );
    // the synced mirror of confirmation state resets with the seed
    await models.User.update({ totpConfirmedAt: null }, { where: { id: user.id } });
    return replacement;
  });

  return {
    id: row.id,
    otpauthUrl: buildTotp(secret, user.email).toString(),
  };
}

async function totpForUser({ models, user, mustBeConfirmed }) {
  const row = await models.TotpSecret.findOne({ where: { userId: user.id } });
  if (!row || (mustBeConfirmed && !row.isConfirmed())) return null;

  const keyBuffer = await getSettingsPskKeyBuffer();
  const base32 = await decryptSecret(keyBuffer, row.secret);
  return { row, totp: buildTotp(OTPAuth.Secret.fromBase32(base32), user.email) };
}

/**
 * Confirm a pending enrolment by checking a code from the user's authenticator
 * app. Only confirmed seeds count at login.
 */
export async function confirmTotp({ models, user, code }) {
  const found = await totpForUser({ models, user, mustBeConfirmed: false });
  if (!found) {
    throw new InvalidCredentialError('No authenticator app enrolment to confirm');
  }
  if (found.totp.validate({ token: code, window: VALIDATION_WINDOW }) === null) {
    throw new InvalidCredentialError('Incorrect authenticator code');
  }
  if (!found.row.isConfirmed()) {
    const confirmedAt = new Date();
    await models.TotpSecret.sequelize.transaction(async () => {
      await found.row.update({ confirmedAt });
      // synced mirror, so facilities can show truthful status
      await models.User.update({ totpConfirmedAt: confirmedAt }, { where: { id: user.id } });
    });
  }
}

/**
 * Check a login code against the user's confirmed seed. Used by the login
 * challenge step; facility servers forward codes here.
 */
export async function verifyTotp({ models, user, code }) {
  const found = await totpForUser({ models, user, mustBeConfirmed: true });
  if (!found || found.totp.validate({ token: code, window: VALIDATION_WINDOW }) === null) {
    // a single error for both cases: an attacker probing a stolen password
    // learns nothing about whether the account has TOTP set up
    throw new InvalidCredentialError('Incorrect authenticator code');
  }
}
