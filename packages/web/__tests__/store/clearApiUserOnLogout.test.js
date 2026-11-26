import { describe, expect, it, vi } from 'vitest';
import { clearApiUserOnLogout } from '../../app/store/initStore';

describe('clearApiUserOnLogout middleware', () => {
  it.each(['LOGOUT', 'LOGOUT_WITH_ERROR'])('clears the api user on %s', type => {
    const api = { setUser: vi.fn() };
    const next = vi.fn(action => action);

    clearApiUserOnLogout(api)()(next)({ type });

    expect(api.setUser).toHaveBeenCalledWith(null);
    expect(next).toHaveBeenCalledWith({ type });
  });

  it('leaves the api user alone for any other action', () => {
    const api = { setUser: vi.fn() };
    const next = vi.fn(action => action);

    clearApiUserOnLogout(api)()(next)({ type: 'LOGIN_SUCCESS' });

    expect(api.setUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith({ type: 'LOGIN_SUCCESS' });
  });
});
