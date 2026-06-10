import { MFA_FACTORS, MFA_PASSWORDLESS, MFA_TOTP_AVAILABILITY } from '@tamanu/constants';
import { originIsUnderRpId } from './webauthn';

/**
 * @typedef {Object} MfaPolicyContext
 *
 * Deployment settings:
 * @property {boolean} mfaEnabled - the `auth.mfa.enabled` feature flag
 * @property {string} totpAvailability - `auth.mfa.totp.availability`
 *   (all | fallbackOnly | off)
 *
 * Capabilities of the server handling this login:
 * @property {boolean} webAuthnAvailable - the rpid is set and this server's
 *   origin is under it (see originIsUnderRpId)
 * @property {boolean} centralReachable - TOTP verification and enrolment happen
 *   at central only; true on central itself, false at an offline facility
 *
 * The user's state:
 * @property {boolean} hasWebAuthnCredential - has a credential bound to the
 *   current rpid
 * @property {boolean} hasConfirmedTotp - has a confirmed TOTP seed
 * @property {boolean} mfaRequired - the user's role carries the `require Mfa`
 *   permission
 *
 * Later inputs, defaulted so PR1 callers can omit them:
 * @property {boolean} [ipExempt=false] - the request came from an
 *   `auth.mfa.ipExempt` range (IP-policy PR)
 * @property {('password'|'webauthn')} [authMethod='password'] - how the user
 *   authenticated; a user-verified passkey assertion is possession + inherence,
 *   so it satisfies MFA by itself (passwordless PR)
 */

/**
 * @typedef {(
 *   | { kind: 'none' }
 *   | { kind: 'challenge', factors: string[] }
 *   | { kind: 'enrol', factors: string[], skippable: boolean }
 *   | { kind: 'blocked' }
 * )} MfaPolicyDecision
 *
 * - none: login proceeds, no second factor.
 * - challenge: the user must pass one of `factors` (passkey-first order).
 * - enrol: the user must (or, when skippable, is nudged to) enrol one of
 *   `factors` before the session is usable.
 * - blocked: MFA is expected but nothing can be verified or enrolled here
 *   (e.g. offline at a server outside the rpid stem). Never downgrade to
 *   password-only: an attacker who can cut the link to central must not be
 *   able to skip the second factor.
 */

/**
 * Whether TOTP may be used (or enrolled) for logins handled by this server.
 * Verification happens at central only, and `fallbackOnly` reserves TOTP for
 * surfaces where WebAuthn can't run. Shared by the policy decision and the
 * TOTP enrolment endpoints so the two can't drift.
 */
export function isTotpAvailable({ totpAvailability, webAuthnAvailable, centralReachable }) {
  return (
    centralReachable &&
    (totpAvailability === MFA_TOTP_AVAILABILITY.ALL ||
      (totpAvailability === MFA_TOTP_AVAILABILITY.FALLBACK_ONLY && !webAuthnAvailable))
  );
}

/**
 * Decide what a login needs beyond the password. One policy function shared by
 * the central and facility login paths, so the rules live in exactly one place.
 *
 * @param {MfaPolicyContext} context
 * @returns {MfaPolicyDecision}
 */
export function resolveMfaPolicy({
  mfaEnabled,
  totpAvailability,
  webAuthnAvailable,
  centralReachable,
  hasWebAuthnCredential,
  hasConfirmedTotp,
  mfaRequired,
  ipExempt = false,
  authMethod = 'password',
}) {
  if (!mfaEnabled) return { kind: 'none' };

  // a user-verified passkey assertion already proved possession + inherence
  if (authMethod === 'webauthn') return { kind: 'none' };

  const totpAllowedHere = isTotpAvailable({
    totpAvailability,
    webAuthnAvailable,
    centralReachable,
  });

  // passkey-first ordering throughout: challenges offer it first, and forced
  // enrolment leads with it
  const usableFactors = [];
  if (webAuthnAvailable && hasWebAuthnCredential) usableFactors.push(MFA_FACTORS.WEBAUTHN);
  if (totpAllowedHere && hasConfirmedTotp) usableFactors.push(MFA_FACTORS.TOTP);

  const enrolableFactors = [];
  if (webAuthnAvailable) enrolableFactors.push(MFA_FACTORS.WEBAUTHN);
  if (totpAllowedHere) enrolableFactors.push(MFA_FACTORS.TOTP);

  // MFA applies when the role requires it, or once the user has any factor —
  // having a factor and not being challenged would be a silent downgrade
  const hasAnyFactor = hasWebAuthnCredential || hasConfirmedTotp;
  if (!mfaRequired && !hasAnyFactor) return { kind: 'none' };

  if (ipExempt) {
    // a trusted range skips the challenge; a required user with no factor is
    // still nudged to enrol (so they're covered off-network) but may skip
    if (mfaRequired && !hasAnyFactor && enrolableFactors.length > 0) {
      return { kind: 'enrol', factors: enrolableFactors, skippable: true };
    }
    return { kind: 'none' };
  }

  if (usableFactors.length > 0) {
    return { kind: 'challenge', factors: usableFactors };
  }

  // MFA applies but nothing the user has works here (no factor yet, or e.g.
  // fallbackOnly hiding TOTP on a WebAuthn-capable surface): force enrolment
  // of whatever this server supports
  if (enrolableFactors.length > 0) {
    return { kind: 'enrol', factors: enrolableFactors, skippable: false };
  }

  return { kind: 'blocked' };
}

/**
 * The effective passwordless mode for a given server origin: `off` unless MFA
 * is enabled, the origin is under the rpid stem, and the setting allows it.
 * One definition for the login gates and the public capability endpoint, on
 * both servers.
 */
export async function effectivePasswordlessMode({ settings, origin }) {
  if (!(await settings.get('auth.mfa.enabled'))) return MFA_PASSWORDLESS.OFF;
  const rpId = await settings.get('auth.mfa.webauthn.rpid');
  if (!originIsUnderRpId(origin, rpId)) return MFA_PASSWORDLESS.OFF;
  return (await settings.get('auth.mfa.passwordless')) ?? MFA_PASSWORDLESS.OFF;
}
