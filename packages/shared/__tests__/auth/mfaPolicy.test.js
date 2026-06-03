import { resolveMfaPolicy } from '../../src/auth/mfaPolicy';

// a fully-capable online central/in-zone context; tests override what they probe
const baseContext = {
  mfaEnabled: true,
  totpAvailability: 'all',
  webAuthnAvailable: true,
  centralReachable: true,
  hasWebAuthnCredential: false,
  hasConfirmedTotp: false,
  mfaRequired: false,
};

const resolve = overrides => resolveMfaPolicy({ ...baseContext, ...overrides });

describe('resolveMfaPolicy', () => {
  describe('feature flag', () => {
    it('does nothing when MFA is disabled, even for enrolled required users', () => {
      expect(
        resolve({
          mfaEnabled: false,
          mfaRequired: true,
          hasWebAuthnCredential: true,
          hasConfirmedTotp: true,
        }),
      ).toEqual({ kind: 'none' });
    });
  });

  describe('auth method', () => {
    it('treats a user-verified passkey assertion as fully authenticated', () => {
      expect(
        resolve({ authMethod: 'webauthn', mfaRequired: true, hasConfirmedTotp: true }),
      ).toEqual({ kind: 'none' });
    });
  });

  describe('users with no factors', () => {
    it('lets unenrolled, unrequired users straight through', () => {
      expect(resolve({})).toEqual({ kind: 'none' });
    });

    it('forces required users to enrol, passkey first', () => {
      expect(resolve({ mfaRequired: true })).toEqual({
        kind: 'enrol',
        factors: ['webauthn', 'totp'],
        skippable: false,
      });
    });

    it('forces enrolment of the only available factor when offline in-zone', () => {
      // offline in-zone facility: WebAuthn enrolment is fully local, TOTP needs central
      expect(resolve({ mfaRequired: true, centralReachable: false })).toEqual({
        kind: 'enrol',
        factors: ['webauthn'],
        skippable: false,
      });
    });

    it('blocks required users when nothing can be verified or enrolled', () => {
      // offline at an out-of-zone server: no WebAuthn (rpid mismatch), no central for TOTP
      expect(
        resolve({ mfaRequired: true, webAuthnAvailable: false, centralReachable: false }),
      ).toEqual({ kind: 'blocked' });
    });

    it('blocks required users when TOTP is off and WebAuthn is unavailable', () => {
      expect(
        resolve({ mfaRequired: true, webAuthnAvailable: false, totpAvailability: 'off' }),
      ).toEqual({ kind: 'blocked' });
    });
  });

  describe('users with factors', () => {
    it('challenges with every usable factor, passkey first', () => {
      expect(resolve({ hasWebAuthnCredential: true, hasConfirmedTotp: true })).toEqual({
        kind: 'challenge',
        factors: ['webauthn', 'totp'],
      });
    });

    it('challenges enrolled users even when not required (no silent downgrade)', () => {
      expect(resolve({ hasConfirmedTotp: true })).toEqual({
        kind: 'challenge',
        factors: ['totp'],
      });
    });

    it('does not offer TOTP when central is unreachable', () => {
      expect(
        resolve({
          hasWebAuthnCredential: true,
          hasConfirmedTotp: true,
          centralReachable: false,
        }),
      ).toEqual({ kind: 'challenge', factors: ['webauthn'] });
    });

    it('blocks a TOTP-only user at an offline out-of-zone server', () => {
      expect(
        resolve({ hasConfirmedTotp: true, webAuthnAvailable: false, centralReachable: false }),
      ).toEqual({ kind: 'blocked' });
    });
  });

  describe('totp availability', () => {
    it('off: hides TOTP everywhere', () => {
      expect(
        resolve({ totpAvailability: 'off', hasConfirmedTotp: true, hasWebAuthnCredential: true }),
      ).toEqual({ kind: 'challenge', factors: ['webauthn'] });
    });

    it('fallbackOnly: accepts TOTP where WebAuthn is unavailable', () => {
      expect(
        resolve({
          totpAvailability: 'fallbackOnly',
          webAuthnAvailable: false,
          hasConfirmedTotp: true,
        }),
      ).toEqual({ kind: 'challenge', factors: ['totp'] });
    });

    it('fallbackOnly: steers a TOTP-only user onto a passkey on a capable surface', () => {
      expect(resolve({ totpAvailability: 'fallbackOnly', hasConfirmedTotp: true })).toEqual({
        kind: 'enrol',
        factors: ['webauthn'],
        skippable: false,
      });
    });
  });

  describe('ip exemption', () => {
    it('skips the challenge for enrolled users', () => {
      expect(resolve({ ipExempt: true, hasWebAuthnCredential: true })).toEqual({ kind: 'none' });
    });

    it('skips the challenge for required enrolled users', () => {
      expect(resolve({ ipExempt: true, mfaRequired: true, hasConfirmedTotp: true })).toEqual({
        kind: 'none',
      });
    });

    it('nudges required unenrolled users with a skippable interstitial', () => {
      expect(resolve({ ipExempt: true, mfaRequired: true })).toEqual({
        kind: 'enrol',
        factors: ['webauthn', 'totp'],
        skippable: true,
      });
    });

    it('does not nudge unrequired unenrolled users', () => {
      expect(resolve({ ipExempt: true })).toEqual({ kind: 'none' });
    });
  });
});
