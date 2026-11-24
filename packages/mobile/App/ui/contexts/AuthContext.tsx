import type { PureAbility } from '@casl/ability';
import NetInfo from '@react-native-community/netinfo';
import type { NavigationContainerRef } from '@react-navigation/native';
import React, {
  createContext,
  type PropsWithChildren,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { readConfig } from '~/services/config';
import type { IUser, ReconnectWithPasswordParameters, SyncConnectionParameters } from '~/types';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { buildAbility } from '~/ui/helpers/ability';
import { resolveAuthErrorAction } from '~/ui/helpers/auth';
import { Routes } from '~/ui/helpers/routes';
import { secureStorage } from '~/ui/helpers/secureStorage';
import { createStoredState } from '~/ui/helpers/storedState';
import { useStoredState } from '~/ui/hooks/useStoredState';
import type { RootStackParamList } from '~/ui/navigation/stacks/Core';
import type { ChangePasswordFormModel } from '/interfaces/forms/ChangePasswordFormProps';
import type { ResetPasswordFormModel } from '/interfaces/forms/ResetPasswordFormProps';

interface AuthProviderProps {
  navRef: RefObject<NavigationContainerRef<RootStackParamList>>;
}

/** The part of the auth state that survives the app closing */
interface Session {
  token: string | null;
  refreshToken: string | null;
  user: IUser | null;
  /**
   * Whether a user is signed in to the app's screens. Holding tokens is a separate fact: an
   * inactivity sign-out clears this and keeps the tokens, so the device carries on syncing.
   */
  signedIn: boolean;
  /** True until this device has shown its welcome introduction */
  isFirstTime: boolean;
}

const initialSession: Session = {
  token: null,
  refreshToken: null,
  user: null,
  signedIn: false,
  isFirstTime: true,
};

// The key redux-persist kept the auth state under, kept so that an app update finds the
// session an earlier build stored
const sessionStore = createStoredState<Session>(secureStorage, 'persist:auth');

interface AuthContextData {
  user: IUser;
  ability: PureAbility;
  signedIn: boolean;
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: () => void;
  reconnectWithPassword: (params: ReconnectWithPasswordParameters) => Promise<void>;
  signOutClient: (signedOutFromInactivity: boolean) => void;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
  checkFirstSession: () => boolean;
  requestResetPassword: (params: ResetPasswordFormModel) => void;
  resetPasswordLastEmailUsed: string;
  changePassword: (params: ChangePasswordFormModel) => void;
  settings: object;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const signUpRoutes = new Set([Routes.SignUpStack.Index, Routes.SignUpStack.SignIn]);

export const AuthProvider = ({ navRef, children }: PropsWithChildren<AuthProviderProps>) => {
  const backend = useContext(BackendContext);
  const [session, setSession, isSessionRestored] = useStoredState(sessionStore, initialSession);
  const { token, refreshToken, user, signedIn, isFirstTime } = session;
  const [settings, setSettings] = useState({});
  const [resetPasswordLastEmailUsed, setResetPasswordLastEmailUsed] = useState('');
  const [preventSignOutOnFailure, setPreventSignOutOnFailure] = useState(false);

  const updateSession = useCallback(
    (changes: Partial<Session>): void => setSession(current => ({ ...current, ...changes })),
    [setSession],
  );

  const generateAbilityForUser = useCallback(
    (userData: IUser): PureAbility => buildAbility(userData, backend.permissions.data),
    [backend],
  );

  // A remote sign-in replaces the stored permissions just before it sets the user, so
  // rebuilding whenever the user changes picks them up
  const ability = useMemo(
    () => (user ? buildAbility(user, backend.permissions.data) : null),
    [user, backend.permissions.data],
  );

  const checkFirstSession = useCallback((): boolean => isFirstTime, [isFirstTime]);

  const setUserFirstSignIn = useCallback(
    (): void => updateSession({ isFirstTime: false }),
    [updateSession],
  );

  const isUserAuthenticated = useCallback(
    (): boolean => token !== null && user !== null,
    [token, user],
  );

  const signInAs = useCallback(
    (authenticatedUser: IUser, tokens?: Pick<Session, 'token' | 'refreshToken'>): void => {
      // Destructure the local password out of the user object - it only needs to be in
      // the database, we don't need or want to store it in app state as well.
      const userData = { ...authenticatedUser };
      delete userData.password;
      updateSession({ ...tokens, user: userData, signedIn: true });
    },
    [updateSession],
  );

  const localSignIn = useCallback(
    async (params: SyncConnectionParameters): Promise<void> => {
      const usr = await backend.auth.localSignIn(params, generateAbilityForUser);
      // An offline sign-in leaves any stored tokens as they are
      signInAs(usr);
    },
    [backend, generateAbilityForUser, signInAs],
  );

  const remoteSignIn = useCallback(
    async (params: SyncConnectionParameters): Promise<void> => {
      const {
        user: usr,
        settings: remoteSettings,
        token: newToken,
        refreshToken: newRefreshToken,
      } = await backend.auth.remoteSignIn(params);
      setSettings(remoteSettings);
      signInAs(usr, { token: newToken, refreshToken: newRefreshToken });
    },
    [backend, signInAs],
  );

  const reconnectWithPassword = useCallback(
    async (params: ReconnectWithPasswordParameters): Promise<void> => {
      const serverLocation = await readConfig('syncServerLocation');
      const payload = {
        email: user?.email,
        server: serverLocation,
        password: params.password,
      };
      setPreventSignOutOnFailure(true);
      await remoteSignIn(payload);
      backend.syncManager.triggerSync();
    },
    [backend, remoteSignIn, user?.email],
  );

  const signIn = useCallback(
    async (params: SyncConnectionParameters): Promise<void> => {
      const network = await NetInfo.fetch();
      if (network.isConnected) {
        await remoteSignIn(params);
      } else {
        await localSignIn(params);
      }

      // When user first sign in and has not chosen a facility, don't start the sync service yet
      const facilityId = await readConfig('facilityId', '');
      if (facilityId) {
        backend.syncManager.triggerSync(); // we deliberately don't await this
      }
    },
    [backend, localSignIn, remoteSignIn],
  );

  // Sign out UI while preserving sync service
  const signOutClient = useCallback(
    (signedOutFromInactivity: boolean): void => {
      updateSession({ signedIn: false });
      const currentRoute = navRef.current?.getCurrentRoute().name;
      if (!signUpRoutes.has(currentRoute)) {
        navRef.current?.reset({
          index: 0,
          routes: [
            {
              name: Routes.SignUpStack.Index,
              params: { signedOutFromInactivity },
            },
          ],
        });
      }
    },
    [navRef, updateSession],
  );

  const signOut = useCallback((): void => {
    backend.stopSyncService(); // we deliberately don't await this
    updateSession({ token: null, refreshToken: null });
    signOutClient(false);
  }, [backend, signOutClient, updateSession]);

  const requestResetPassword = useCallback(
    async (params: ResetPasswordFormModel): Promise<void> => {
      await backend.auth.requestResetPassword(params);
      setResetPasswordLastEmailUsed(params.email);
    },
    [backend],
  );

  const changePassword = useCallback(
    async (params: ChangePasswordFormModel): Promise<void> => {
      await backend.auth.changePassword(params);
    },
    [backend],
  );

  // start a session if there's a stored token
  useEffect(() => {
    if (!isSessionRestored) return;
    if (token && user) {
      backend.auth.startSession(token, refreshToken);
    } else {
      backend.auth.endSession();
    }
  }, [backend, isSessionRestored, token, refreshToken, user]);

  // Sign user out if an auth error was thrown
  // except if user is trying to reconnect with password from modal interface
  useEffect(() => {
    const errHandler = (): void => {
      const { shouldSignOut, nextPreventSignOutOnFailure } =
        resolveAuthErrorAction(preventSignOutOnFailure);
      // reset the flag so a subsequent auth error is no longer skipped
      setPreventSignOutOnFailure(nextPreventSignOutOnFailure);
      if (shouldSignOut) {
        signOut();
      }
    };
    backend.auth.emitter.on('authError', errHandler);
    return () => {
      backend.auth.emitter.off('authError', errHandler);
    };
  }, [backend, signOut, preventSignOutOnFailure]);

  const value = useMemo(
    (): AuthContextData => ({
      setUserFirstSignIn,
      signIn,
      signOut,
      reconnectWithPassword,
      signOutClient,
      isUserAuthenticated,
      checkFirstSession,
      user,
      signedIn,
      ability,
      settings,
      requestResetPassword,
      resetPasswordLastEmailUsed,
      changePassword,
    }),
    [
      setUserFirstSignIn,
      signIn,
      signOut,
      reconnectWithPassword,
      signOutClient,
      isUserAuthenticated,
      checkFirstSession,
      user,
      signedIn,
      ability,
      settings,
      requestResetPassword,
      resetPasswordLastEmailUsed,
      changePassword,
    ],
  );

  // Nothing below can render correctly until the stored session has been read
  if (!isSessionRestored) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextData => useContext(AuthContext);
export default AuthContext;
