/**
 * A user-facing message for a failed WebAuthn enrolment ceremony, plus a
 * console.error for diagnosis. Management surfaces (self-service enrol, admin
 * provisioning, invite redemption) can surface the real cause — unlike the
 * login boundary, where errors stay deliberately generic so an attacker
 * learns nothing.
 *
 * `getTranslation` comes from useTranslation(); the second argument is the
 * fallback copy.
 */
export const webauthnErrorMessage = (error, getTranslation) => {
  // always leave a trace: the generic toast otherwise hides the real cause
  // eslint-disable-next-line no-console
  console.error('WebAuthn ceremony failed', error);

  // browser-side ceremony outcomes are DOMExceptions with a stable name
  switch (error?.name) {
    case 'NotAllowedError':
      // cancelled, or the prompt timed out (often because a slow first
      // request delayed it past the activation/ceremony window)
      return getTranslation(
        'mfa.webauthn.notAllowed',
        'The passkey prompt was dismissed or timed out. Please try again.',
      );
    case 'InvalidStateError':
      return getTranslation(
        'mfa.webauthn.alreadyRegistered',
        'This device already has a passkey for this account.',
      );
    case 'SecurityError':
      return getTranslation(
        'mfa.webauthn.security',
        'This site is not configured for passkeys (relying party ID mismatch).',
      );
    default:
      break;
  }

  // a server-side rejection (e.g. attestation verification failed) carries a
  // useful message; surface it rather than the catch-all
  if (typeof error?.message === 'string' && error.message) {
    return error.message;
  }

  return getTranslation('mfa.webauthn.error', 'Passkey could not be used. Please try again.');
};
