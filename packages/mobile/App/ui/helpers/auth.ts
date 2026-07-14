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
