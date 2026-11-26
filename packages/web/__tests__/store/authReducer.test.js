import { describe, expect, it } from 'vitest';

import { authReducer, idleTimeout, logout } from '../../app/store/auth';

const settings = { telemetry: { enabled: true } };

describe('authReducer', () => {
  it.each([
    ['logout', logout()],
    ['idle timeout', idleTimeout()],
  ])("drops the session's settings on %s", (_, action) => {
    const signedIn = authReducer(undefined, { type: 'SET_SETTINGS', settings });
    expect(signedIn.settings).toEqual(settings);

    expect(authReducer(signedIn, action).settings).toBeNull();
  });
});
