import { resolveAuthErrorAction } from './auth';

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
