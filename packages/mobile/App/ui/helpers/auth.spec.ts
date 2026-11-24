import { ERROR_TYPE, Problem } from '@tamanu/errors';
import { AuthenticationError, invalidDeviceMessage, OutdatedVersionError } from '~/services/error';
import { CentralWakingError } from '~/services/sync/CentralServerConnection';
import { canFallBackToLocalSignIn, resolveAuthErrorAction } from './auth';

describe('resolveAuthErrorAction', () => {
  it('skips sign-out for the first auth error while a reconnect is armed', () => {
    expect(resolveAuthErrorAction(true)).toEqual({
      shouldSignOut: false,
      nextPreventSignOutOnFailure: false,
    });
  });

  it('signs out on an auth error when no reconnect is armed', () => {
    expect(resolveAuthErrorAction(false)).toEqual({
      shouldSignOut: true,
      nextPreventSignOutOnFailure: false,
    });
  });

  it('always clears the flag, so a second consecutive auth error signs out', () => {
    // Regression guard: the bug reset the flag back to true, so once the reconnect
    // modal had been used every later auth error was swallowed for the session.
    const first = resolveAuthErrorAction(true);
    expect(first.shouldSignOut).toBe(false);
    expect(first.nextPreventSignOutOnFailure).toBe(false);

    // The flag is now false, so the next error must sign the user out.
    expect(resolveAuthErrorAction(first.nextPreventSignOutOnFailure).shouldSignOut).toBe(true);
  });
});

describe('canFallBackToLocalSignIn', () => {
  it('falls back when central could not be reached', () => {
    // what CentralServerConnection raises when a request gets no response
    const unreachable = new Problem(ERROR_TYPE.UNKNOWN, 'Network Error', undefined);
    expect(canFallBackToLocalSignIn(unreachable)).toBe(true);
  });

  it('falls back when central fails with an error of its own', () => {
    const gatewayError = new Problem(
      ERROR_TYPE.UNKNOWN,
      'Request failed with status code 502',
      502,
    );
    expect(canFallBackToLocalSignIn(gatewayError)).toBe(true);
  });

  it.each([
    [
      'wrong credentials',
      new Problem(ERROR_TYPE.AUTH_CREDENTIAL_INVALID, 'Invalid credentials', 401),
    ],
    ['a lockout', new Problem(ERROR_TYPE.RATE_LIMITED, 'Too many attempts', 429)],
    ['a forbidden login', new Problem(ERROR_TYPE.FORBIDDEN, 'Forbidden', 403)],
    ['an unapproved device', new AuthenticationError(invalidDeviceMessage)],
    ['an outdated app', new OutdatedVersionError('https://example.com/update')],
    ['a waking central', new CentralWakingError()],
  ])('does not fall back on %s', (_reason, error) => {
    expect(canFallBackToLocalSignIn(error)).toBe(false);
  });
});
