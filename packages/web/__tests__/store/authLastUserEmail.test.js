import { describe, expect, it } from 'vitest';
import { authReducer, logout, idleTimeout } from '../../app/store/auth';

const signIn = state =>
  authReducer(state, { type: 'LOGIN_SUCCESS', user: { id: 'alice', email: 'alice@example.com' } });

describe('auth reducer lastUserEmail', () => {
  it('records the email of whoever signs in', () => {
    expect(signIn(undefined).lastUserEmail).toBe('alice@example.com');
  });

  it.each([
    ['logout', logout()],
    ['idle timeout', idleTimeout()],
  ])('outlives sign-out by %s, while the user is cleared', (_, action) => {
    const state = authReducer(signIn(undefined), action);
    expect(state.user).toBeNull();
    expect(state.lastUserEmail).toBe('alice@example.com');
  });
});
