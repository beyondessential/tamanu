import NetInfo from '@react-native-community/netinfo';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import mitt from 'mitt';
import React, { type ReactNode } from 'react';
import * as Keychain from 'react-native-keychain';
import { readConfig } from '~/services/config';
import { Routes } from '~/ui/helpers/routes';
import { AuthProvider, preloadSession, useAuth } from './AuthContext';
import { BackendContext } from './BackendContext';

// The real module builds the backend, database and all, as it loads
jest.mock('./BackendContext', () => {
  const { createContext } = jest.requireActual('react');
  return { BackendContext: createContext(undefined) };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));

jest.mock('~/services/config', () => ({
  readConfig: jest.fn(),
}));

jest.useRealTimers();

const mockGetStored = Keychain.getGenericPassword as jest.Mock;
const mockSetStored = Keychain.setGenericPassword as jest.Mock;
const mockNetInfoFetch = NetInfo.fetch as jest.Mock;
const mockReadConfig = readConfig as jest.Mock;

const KEYCHAIN_SERVICE = 'tamanu-persist.persist:auth';

const user = { id: 'user-1', email: 'ana@example.com', displayName: 'Ana', role: 'practitioner' };
const signedInSession = {
  token: 'token-1',
  refreshToken: 'refresh-1',
  user,
  signedIn: true,
  isFirstTime: false,
};

/** The shape redux-persist wrote: each value a JSON string of its own, plus `_persist` */
const asReduxPersistEntry = (state: Record<string, unknown>): string =>
  JSON.stringify({
    ...Object.fromEntries(
      Object.entries(state).map(([key, value]) => [key, JSON.stringify(value)]),
    ),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });

const createBackend = () => ({
  auth: {
    localSignIn: jest.fn(),
    remoteSignIn: jest.fn(),
    startSession: jest.fn(),
    endSession: jest.fn(),
    emitter: mitt(),
  },
  permissions: { data: [{ verb: 'read', noun: 'Patient' }] },
  syncManager: { triggerSync: jest.fn() },
  stopSyncService: jest.fn(),
});

const createNavigation = (currentRoute: string = Routes.HomeStack.Index) => ({
  current: {
    getCurrentRoute: jest.fn(() => ({ name: currentRoute })),
    reset: jest.fn(),
  },
});

const renderAuth = async ({
  stored,
  backend = createBackend(),
  navigation = createNavigation(),
}: {
  stored?: string;
  backend?: ReturnType<typeof createBackend>;
  navigation?: ReturnType<typeof createNavigation>;
} = {}) => {
  mockGetStored.mockResolvedValue(stored ? { password: stored } : false);
  const { result } = await renderAuthHook(backend, navigation);
  // The provider renders nothing until it has read the stored session
  await waitFor(() => expect(result.current).not.toBeNull());
  return { result, backend, navigation };
};

const renderAuthHook = (
  backend: ReturnType<typeof createBackend>,
  navigation: ReturnType<typeof createNavigation>,
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BackendContext.Provider value={backend as any}>
      <AuthProvider navRef={navigation as any}>{children}</AuthProvider>
    </BackendContext.Provider>
  );
  return renderHook(() => useAuth(), { wrapper });
};

const lastStoredSession = () => JSON.parse(mockSetStored.mock.calls.at(-1)[1]);

/** Lets a write that has been started reach storage, so its absence means something */
const flushStorage = () =>
  act(
    () =>
      new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockNetInfoFetch.mockResolvedValue({ isConnected: true });
  mockReadConfig.mockImplementation(async (key: string) =>
    key === 'facilityId' ? 'facility-1' : 'https://central.example.com',
  );
});

describe('AuthProvider', () => {
  describe('opening the app', () => {
    it('starts signed out when nothing is stored', async () => {
      const { result, backend } = await renderAuth();

      expect(mockGetStored).toHaveBeenCalledWith({ service: KEYCHAIN_SERVICE });
      expect(result.current.signedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.checkFirstSession()).toBe(true);
      expect(backend.auth.startSession).not.toHaveBeenCalled();
    });

    it('holds everything back until the stored session has been read', async () => {
      let finishReading: (stored: { password: string }) => void;
      mockGetStored.mockReturnValue(
        new Promise(resolve => {
          finishReading = resolve;
        }),
      );
      const backend = createBackend();

      const { result } = await renderAuthHook(backend, createNavigation());
      await flushStorage();

      expect(result.current).toBeNull();
      expect(backend.auth.startSession).not.toHaveBeenCalled();
      expect(backend.auth.endSession).not.toHaveBeenCalled();
      expect(mockSetStored).not.toHaveBeenCalled();

      await act(async () => finishReading({ password: JSON.stringify(signedInSession) }));

      expect(result.current.signedIn).toBe(true);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-1', 'refresh-1');
    });

    it('picks up a session that was read before it mounted', async () => {
      mockGetStored.mockResolvedValue({ password: JSON.stringify(signedInSession) });
      preloadSession();

      // Nothing is stored by now, so the session can only have come from the earlier read
      const { result, backend } = await renderAuth();

      expect(mockGetStored).toHaveBeenCalledTimes(1);
      expect(result.current.signedIn).toBe(true);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-1', 'refresh-1');
    });

    it('opens signed in from a stored session', async () => {
      const { result, backend } = await renderAuth({ stored: JSON.stringify(signedInSession) });

      expect(result.current.signedIn).toBe(true);
      expect(result.current.user).toEqual(user);
      expect(result.current.checkFirstSession()).toBe(false);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-1', 'refresh-1');
    });

    it('opens signed in from a session an earlier build stored through redux-persist', async () => {
      const { result, backend } = await renderAuth({
        stored: asReduxPersistEntry(signedInSession),
      });

      expect(result.current.signedIn).toBe(true);
      expect(result.current.user).toEqual(user);
      expect(result.current.checkFirstSession()).toBe(false);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-1', 'refresh-1');
    });

    it('hands stored tokens to the central server with nobody signed in', async () => {
      const { result, backend } = await renderAuth({
        stored: JSON.stringify({ ...signedInSession, signedIn: false }),
      });

      expect(result.current.signedIn).toBe(false);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-1', 'refresh-1');
    });

    it('restores permissions for a user who last signed in offline', async () => {
      const { result, backend } = await renderAuth({
        stored: JSON.stringify({ ...signedInSession, token: null, refreshToken: null }),
      });

      expect(result.current.signedIn).toBe(true);
      expect(result.current.user).toEqual(user);
      expect(result.current.ability.can('read', 'Patient')).toBe(true);
      expect(result.current.ability.can('write', 'Patient')).toBe(false);
      expect(backend.auth.startSession).not.toHaveBeenCalled();
    });

    it('starts signed out when the stored session cannot be read', async () => {
      const { result } = await renderAuth({ stored: '{"token":' });

      expect(result.current.signedIn).toBe(false);
      expect(result.current.checkFirstSession()).toBe(true);
    });

    it('leaves a stored session it cannot read as it is', async () => {
      await renderAuth({ stored: '{"token":' });
      await flushStorage();

      expect(mockSetStored).not.toHaveBeenCalled();
    });

    it('does not store again the session it has just read', async () => {
      await renderAuth({ stored: asReduxPersistEntry(signedInSession) });
      await flushStorage();

      expect(mockSetStored).not.toHaveBeenCalled();
    });

    it('stores the session once it changes', async () => {
      const { result } = await renderAuth({ stored: asReduxPersistEntry(signedInSession) });

      await act(async () => result.current.signOutClient(true));

      await waitFor(() =>
        expect(lastStoredSession()).toEqual({ ...signedInSession, signedIn: false }),
      );
    });
  });

  describe('signing in', () => {
    it('sets the user and both tokens when online', async () => {
      const { result, backend } = await renderAuth();
      backend.auth.remoteSignIn.mockResolvedValue({
        user: { ...user, password: 'hashed' },
        token: 'token-2',
        refreshToken: 'refresh-2',
        settings: { vitals: true },
      });

      await act(() =>
        result.current.signIn({ email: user.email, password: 'secret', server: 'ignored' }),
      );

      expect(result.current.signedIn).toBe(true);
      expect(result.current.user).toEqual(user);
      expect(result.current.settings).toEqual({ vitals: true });
      expect(result.current.ability.can('read', 'Patient')).toBe(true);
      expect(backend.auth.startSession).toHaveBeenCalledWith('token-2', 'refresh-2');
      expect(backend.syncManager.triggerSync).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(lastStoredSession()).toEqual({
          token: 'token-2',
          refreshToken: 'refresh-2',
          user,
          signedIn: true,
          isFirstTime: true,
        }),
      );
      expect(mockSetStored).toHaveBeenLastCalledWith('persist:auth', expect.any(String), {
        service: KEYCHAIN_SERVICE,
      });
    });

    it('sets the user and leaves the stored tokens when offline', async () => {
      mockNetInfoFetch.mockResolvedValue({ isConnected: false });
      const otherUser = { ...user, id: 'user-2', displayName: 'Sione' };
      const { result, backend } = await renderAuth({
        stored: JSON.stringify({ ...signedInSession, signedIn: false }),
      });
      backend.auth.localSignIn.mockResolvedValue({ ...otherUser, password: 'hashed' });

      await act(() =>
        result.current.signIn({ email: otherUser.email, password: 'secret', server: 'ignored' }),
      );

      expect(backend.auth.remoteSignIn).not.toHaveBeenCalled();
      expect(result.current.signedIn).toBe(true);
      expect(result.current.user).toEqual(otherUser);
      await waitFor(() =>
        expect(lastStoredSession()).toEqual({
          ...signedInSession,
          user: otherUser,
          signedIn: true,
        }),
      );
    });

    it('does not start a sync before a facility is linked', async () => {
      mockReadConfig.mockResolvedValue('');
      const { result, backend } = await renderAuth();
      backend.auth.remoteSignIn.mockResolvedValue({
        user,
        token: 'token-2',
        refreshToken: 'refresh-2',
        settings: {},
      });

      await act(() =>
        result.current.signIn({ email: user.email, password: 'secret', server: 'server' }),
      );

      expect(result.current.signedIn).toBe(true);
      expect(backend.syncManager.triggerSync).not.toHaveBeenCalled();
    });
  });

  describe('signing out', () => {
    it('discards the tokens, stops syncing and shows the log in screen', async () => {
      const { result, backend, navigation } = await renderAuth({
        stored: JSON.stringify(signedInSession),
      });

      await act(async () => result.current.signOut());

      expect(result.current.signedIn).toBe(false);
      expect(backend.stopSyncService).toHaveBeenCalledTimes(1);
      expect(backend.auth.endSession).toHaveBeenCalledTimes(1);
      expect(navigation.current.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: Routes.SignUpStack.Index, params: { signedOutFromInactivity: false } }],
      });
      // The user and the welcome introduction state outlive the sign-out
      await waitFor(() =>
        expect(lastStoredSession()).toEqual({
          token: null,
          refreshToken: null,
          user,
          signedIn: false,
          isFirstTime: false,
        }),
      );
    });

    it('leaves the log in screen as it is when it is already showing', async () => {
      const navigation = createNavigation(Routes.SignUpStack.SignIn);
      const { result } = await renderAuth({
        stored: JSON.stringify(signedInSession),
        navigation,
      });

      await act(async () => result.current.signOut());

      expect(result.current.signedIn).toBe(false);
      expect(navigation.current.reset).not.toHaveBeenCalled();
    });

    it('keeps the tokens and carries on syncing after an inactivity sign-out', async () => {
      const { result, backend, navigation } = await renderAuth({
        stored: JSON.stringify(signedInSession),
      });

      await act(async () => result.current.signOutClient(true));

      expect(result.current.signedIn).toBe(false);
      expect(backend.stopSyncService).not.toHaveBeenCalled();
      expect(backend.auth.endSession).not.toHaveBeenCalled();
      expect(navigation.current.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: Routes.SignUpStack.Index, params: { signedOutFromInactivity: true } }],
      });
      await waitFor(() =>
        expect(lastStoredSession()).toEqual({ ...signedInSession, signedIn: false }),
      );
    });
  });

  describe('welcome introduction', () => {
    it('stays shown once it has been marked as shown', async () => {
      const { result } = await renderAuth();
      expect(result.current.checkFirstSession()).toBe(true);

      await act(async () => result.current.setUserFirstSignIn());

      expect(result.current.checkFirstSession()).toBe(false);
      await waitFor(() => expect(lastStoredSession().isFirstTime).toBe(false));
    });
  });

  describe('refused log ins', () => {
    it('signs the device out when the central server refuses a log in', async () => {
      const { result, backend } = await renderAuth({ stored: JSON.stringify(signedInSession) });

      await act(async () => backend.auth.emitter.emit('authError', new Error('refused')));

      expect(result.current.signedIn).toBe(false);
      expect(backend.stopSyncService).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(lastStoredSession().token).toBeNull());
    });

    it('reconnects with a password as the signed-in user and starts a sync', async () => {
      const { result, backend } = await renderAuth({ stored: JSON.stringify(signedInSession) });
      backend.auth.remoteSignIn.mockResolvedValue({
        user,
        token: 'token-2',
        refreshToken: 'refresh-2',
        settings: {},
      });

      await act(() => result.current.reconnectWithPassword({ password: 'secret' }));

      expect(backend.auth.remoteSignIn).toHaveBeenCalledWith({
        email: user.email,
        server: 'https://central.example.com',
        password: 'secret',
      });
      expect(backend.auth.startSession).toHaveBeenLastCalledWith('token-2', 'refresh-2');
      expect(backend.syncManager.triggerSync).toHaveBeenCalledTimes(1);
    });

    it('leaves the user signed in on the first refused log in after a reconnect attempt', async () => {
      const { result, backend } = await renderAuth({ stored: JSON.stringify(signedInSession) });
      backend.auth.remoteSignIn.mockRejectedValue(new Error('Invalid credentials'));

      await act(async () => {
        await expect(result.current.reconnectWithPassword({ password: 'wrong' })).rejects.toThrow(
          'Invalid credentials',
        );
      });
      await act(async () => backend.auth.emitter.emit('authError', new Error('refused')));

      expect(result.current.signedIn).toBe(true);

      await act(async () => backend.auth.emitter.emit('authError', new Error('refused')));

      expect(result.current.signedIn).toBe(false);
    });
  });
});
