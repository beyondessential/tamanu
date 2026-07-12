import React from 'react';
import { EventEmitter } from 'events';
import { act, render } from '@testing-library/react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { actions, authReducer } from '~/ui/store/ducks/auth';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Regression coverage for the auth sign-out flag fix.
//
// When the user re-authenticates through the reconnect-with-password modal, the
// AuthContext sets `preventSignOutOnFailure` so the NEXT auth error is skipped (the user
// is mid-retry). Previously the authError handler reset the flag back to `true`, so once
// the reconnect modal had been used the flag stayed true forever: every subsequent auth
// error was swallowed and the user was never signed out, leaving the app "signed in" with
// dead authentication. The fix resets the flag to `false` so only the FIRST auth error is
// skipped and a SECOND consecutive auth error signs the user out as normal.
describe('AuthContext auth error handling', () => {
  let store;
  let backend;
  let emitter: EventEmitter;
  let auth;

  const renderProvider = () => {
    const navRef = {
      current: {
        getCurrentRoute: () => ({ name: 'Home' }),
        reset: jest.fn(),
      },
    };

    const CaptureAuth = (): null => {
      auth = useAuth();
      return null;
    };

    return render(
      <ReduxProvider store={store}>
        <BackendContext.Provider value={backend}>
          <AuthProvider navRef={navRef}>
            <CaptureAuth />
          </AuthProvider>
        </BackendContext.Provider>
      </ReduxProvider>,
    );
  };

  beforeEach(() => {
    store = configureStore({ reducer: { auth: authReducer } });
    emitter = new EventEmitter();
    backend = {
      auth: {
        emitter,
        remoteSignIn: jest.fn().mockResolvedValue({
          user: { id: 'user-1', email: 'user@example.com', role: 'practitioner' },
          settings: {},
          token: 'test-token',
          refreshToken: 'test-refresh-token',
        }),
        startSession: jest.fn(),
        endSession: jest.fn(),
      },
      permissions: { data: [] },
      syncManager: { triggerSync: jest.fn() },
      stopSyncService: jest.fn(),
    };
  });

  it('skips sign-out on the first auth error after reconnect, then signs out on the second', async () => {
    renderProvider();

    // Re-authenticate through the reconnect modal, which arms preventSignOutOnFailure.
    await act(async () => {
      await auth.reconnectWithPassword({ password: 'correct-password' });
    });
    expect(store.getState().auth.signedIn).toBe(true);

    // First auth error after reconnect: the user is mid-retry, so it must be skipped.
    await act(async () => {
      emitter.emit('authError');
    });
    expect(backend.stopSyncService).not.toHaveBeenCalled();
    expect(store.getState().auth.signedIn).toBe(true);

    // Second, consecutive auth error: the skip must NOT persist — the user is signed out.
    await act(async () => {
      emitter.emit('authError');
    });
    expect(backend.stopSyncService).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.signedIn).toBe(false);
  });

  it('signs out immediately on an auth error when no reconnect is in progress', async () => {
    renderProvider();

    // Represent a normally authenticated session; the reconnect flag was never armed.
    act(() => {
      store.dispatch(actions.setSignedInStatus(true));
    });
    expect(store.getState().auth.signedIn).toBe(true);

    await act(async () => {
      emitter.emit('authError');
    });
    expect(backend.stopSyncService).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.signedIn).toBe(false);
  });
});
