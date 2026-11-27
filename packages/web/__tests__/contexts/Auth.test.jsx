import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVER_TYPES } from '@tamanu/constants';
import { ApiContext } from '@tamanu/ui-components';

import { AuthProvider, useAuth } from '../../app/contexts/Auth';
import { systemErrorStore } from '../../app/state/systemErrorStore';
import { createQueryClient } from '../helpers/render';

const user = { id: 'user-1', email: 'alice@example.com', role: 'practitioner' };
const settings = { telemetry: { enabled: true } };
const freshSettings = { telemetry: { enabled: false } };

const buildLoginInfo = ({ availableFacilities = [] } = {}) => ({
  user,
  token: 'token-1',
  server: { type: availableFacilities.length ? SERVER_TYPES.FACILITY : SERVER_TYPES.CENTRAL },
  availableFacilities,
  permissions: [],
  settings,
});

const createApi = (overrides = {}) => ({
  restoreSession: vi.fn(async () => {
    throw new Error('No stored session found.');
  }),
  login: vi.fn(async () => buildLoginInfo()),
  setFacility: vi.fn(async () => ({ settings })),
  fetchFrontEndSettings: vi.fn(async () => freshSettings),
  persistSettings: vi.fn(),
  setUser: vi.fn(),
  setAuthFailureHandler: vi.fn(),
  setVersionIncompatibleHandler: vi.fn(),
  refreshToken: vi.fn(),
  post: vi.fn(async () => ({ token: 'token-2', permissions: [] })),
  setToken: vi.fn(),
  ...overrides,
});

const renderAuth = async api => {
  const queryClient = createQueryClient();
  const { result } = renderHook(() => useAuth(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={api}>
          <MemoryRouter>
            <AuthProvider>{children}</AuthProvider>
          </MemoryRouter>
        </ApiContext.Provider>
      </QueryClientProvider>
    ),
  });
  await waitFor(() => expect(result.current.isRestoring).toBe(false));
  return result;
};

const renderSignedIn = async (api, loginInfo) => {
  if (loginInfo) api.login.mockResolvedValue(loginInfo);
  const result = await renderAuth(api);
  await act(() => result.current.login(user.email, 'password'));
  return result;
};

const endings = [
  ['logout', result => result.current.onLogout()],
  ['idle timeout', result => result.current.onTimeout()],
];

describe('AuthProvider', () => {
  beforeEach(() => {
    // Node's own localStorage global shadows jsdom's, and is undefined without a storage file
    const items = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: key => items.delete(key),
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('restores a stored session, then listens for the server ending it', async () => {
    const api = createApi({ restoreSession: vi.fn(async () => buildLoginInfo()) });
    const result = await renderAuth(api);

    expect(result.current.currentUser).toEqual(user);
    expect(api.restoreSession.mock.invocationCallOrder[0]).toBeLessThan(
      api.setAuthFailureHandler.mock.invocationCallOrder[0],
    );
  });

  it.each(endings)("drops the session's settings on %s", async (_, end) => {
    const result = await renderSignedIn(createApi());
    expect(result.current.settings).toEqual(settings);

    act(() => end(result));

    expect(result.current.settings).toBeNull();
  });

  describe('lastUserEmail', () => {
    it('records the email of whoever signs in', async () => {
      const result = await renderSignedIn(createApi());
      expect(result.current.lastUserEmail).toBe(user.email);
    });

    it.each(endings)('outlives sign-out by %s, while the user is cleared', async (_, end) => {
      const result = await renderSignedIn(createApi());

      act(() => end(result));

      expect(result.current.currentUser).toBeNull();
      expect(result.current.lastUserEmail).toBe(user.email);
    });
  });

  // spec: BTEL
  describe('api user', () => {
    it.each([
      ...endings,
      ['auth failure', (_, api) => api.setAuthFailureHandler.mock.calls[0][0]()],
      [
        'incompatible version',
        (_, api) => api.setVersionIncompatibleHandler.mock.calls[0][0]('Too old'),
      ],
    ])('is cleared on %s', async (_, end) => {
      const api = createApi();
      const result = await renderSignedIn(api);

      act(() => end(result, api));

      expect(api.setUser).toHaveBeenCalledWith(null);
    });

    it('is left alone on sign-in', async () => {
      const api = createApi();
      await renderSignedIn(api);
      expect(api.setUser).not.toHaveBeenCalled();
    });
  });

  describe('system errors', () => {
    beforeEach(() => systemErrorStore.clear());

    const seed = () =>
      systemErrorStore.add({ id: '1', timestamp: new Date().toISOString(), message: 'boom' });

    it('are cleared on sign-in', async () => {
      const api = createApi();
      const result = await renderAuth(api);
      seed();

      await act(() => result.current.login(user.email, 'password'));

      expect(systemErrorStore.getSnapshot()).toEqual([]);
    });

    it('are cleared when a stored session is restored', async () => {
      seed();
      await renderAuth(createApi({ restoreSession: vi.fn(async () => buildLoginInfo()) }));
      expect(systemErrorStore.getSnapshot()).toEqual([]);
    });

    it('are cleared on logout', async () => {
      const result = await renderSignedIn(createApi());
      seed();

      act(() => result.current.onLogout());

      expect(systemErrorStore.getSnapshot()).toEqual([]);
    });
  });

  describe('impersonation', () => {
    const role = { id: 'role-1', name: 'Nurse' };

    // Read the result outside act, which would flush a pending render itself
    let wasActEnvironment;
    beforeEach(() => {
      wasActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
      globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    });
    afterEach(() => {
      globalThis.IS_REACT_ACT_ENVIRONMENT = wasActEnvironment;
    });

    it('renders the role before starting resolves, so the caller refreshes against it', async () => {
      const result = await renderSignedIn(createApi());

      await result.current.startImpersonation(role);

      expect(result.current.impersonatingRole).toEqual(role);
    });

    it('renders the user before stopping resolves, so the caller refreshes against it', async () => {
      const result = await renderSignedIn(createApi());
      await result.current.startImpersonation(role);
      await waitFor(() => expect(result.current.impersonatingRole).toEqual(role));

      await result.current.stopImpersonation();

      expect(result.current.impersonatingRole).toBeNull();
    });
  });

  describe('refreshSettings', () => {
    it('re-reads the settings of an admin panel session, which has no facility', async () => {
      const api = createApi();
      const result = await renderSignedIn(api);

      await act(() => result.current.refreshSettings());

      expect(api.fetchFrontEndSettings).toHaveBeenCalledWith(null);
      expect(api.persistSettings).toHaveBeenCalledWith(freshSettings);
      expect(result.current.settings).toEqual(freshSettings);
    });

    it("re-reads the selected facility's settings", async () => {
      const api = createApi();
      const result = await renderSignedIn(
        api,
        buildLoginInfo({ availableFacilities: [{ id: 'facility-1' }] }),
      );

      await act(() => result.current.refreshSettings());

      expect(api.fetchFrontEndSettings).toHaveBeenCalledWith('facility-1');
      expect(api.persistSettings).toHaveBeenCalledWith(freshSettings);
    });

    it('drops the response when the user logs out while it is in flight', async () => {
      const api = createApi();
      const result = await renderSignedIn(api);
      api.fetchFrontEndSettings.mockImplementation(async () => {
        result.current.logout();
        return freshSettings;
      });

      await act(() => result.current.refreshSettings());

      expect(api.persistSettings).not.toHaveBeenCalled();
      expect(result.current.settings).toBeNull();
    });

    it('drops the response when the facility changes while it is in flight', async () => {
      const api = createApi();
      const result = await renderSignedIn(
        api,
        buildLoginInfo({ availableFacilities: [{ id: 'facility-1' }] }),
      );
      api.fetchFrontEndSettings.mockImplementation(async () => {
        await result.current.selectFacility('facility-2');
        return freshSettings;
      });

      await act(() => result.current.refreshSettings());

      expect(api.persistSettings).not.toHaveBeenCalled();
      expect(result.current.settings).toEqual(settings);
    });
  });
});
