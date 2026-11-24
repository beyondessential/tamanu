import { ERROR_TYPE, Problem } from '@tamanu/errors';

interface AuthErrorAction {
  // whether this auth error should sign the user out
  shouldSignOut: boolean;
  // the value preventSignOutOnFailure must take after handling this error
  nextPreventSignOutOnFailure: boolean;
}

/**
 * Decide how to respond to an auth error.
 *
 * `preventSignOutOnFailure` is armed while the user re-authenticates through the
 * reconnect-with-password modal, so the first auth error after that is skipped
 * rather than signing the user out. The flag must then reset to `false` so a
 * subsequent auth error signs the user out as normal — leaving it `true` would
 * swallow every later auth error for the rest of the session.
 */
export const resolveAuthErrorAction = (preventSignOutOnFailure: boolean): AuthErrorAction => ({
  shouldSignOut: !preventSignOutOnFailure,
  nextPreventSignOutOnFailure: false,
});

/**
 * Whether a failed central login may fall back to the device's own copy of the user.
 *
 * Only when central gave no verdict on the credentials: it could not be reached (a
 * connected network with no internet behind it, a timeout) or it failed with an error
 * of its own. Anything central decided (wrong credentials, a lockout, an unapproved
 * device, an outdated app) must stand, so that credentials central rejects can't
 * succeed against a stale local password.
 */
export const canFallBackToLocalSignIn = (error: unknown): boolean =>
  error instanceof Problem && error.type === ERROR_TYPE.UNKNOWN;
