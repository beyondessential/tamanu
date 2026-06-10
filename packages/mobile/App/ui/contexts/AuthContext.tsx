import React, {
  createContext,
  PropsWithChildren,
  ReactElement,
  RefObject,
  useContext,
  useEffect,
  useState,
} from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { PureAbility } from '@casl/ability';
import { readConfig } from '~/services/config';
import { withAuth } from '~/ui/containers/Auth';
import { WithAuthStoreProps } from '~/ui/store/ducks/auth';
import { Routes } from '~/ui/helpers/routes';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { IUser, ReconnectWithPasswordParameters, SyncConnectionParameters } from '~/types';
import { MfaEnrolResponse, MfaLoginStep, MfaPending } from '~/services/sync';
import { ResetPasswordFormModel } from '/interfaces/forms/ResetPasswordFormProps';
import { ChangePasswordFormModel } from '/interfaces/forms/ChangePasswordFormProps';
import { buildAbility } from '~/ui/helpers/ability';
import { User } from '~/models/User';

type AuthProviderProps = WithAuthStoreProps & {
  navRef: RefObject<NavigationContainerRef>;
};

interface AuthContextData {
  user: IUser;
  ability: PureAbility;
  signedIn: boolean;
  signIn: (params: SyncConnectionParameters) => Promise<'success' | 'mfa'>;
  // set while a sign-in is paused for a second factor
  mfaPending: MfaPending | null;
  // non-terminal MFA step, e.g. 'totp/enrol' to get the otpauth URI
  beginMfaSignInStep: (path: MfaLoginStep, body?: Record<string, unknown>) => Promise<MfaEnrolResponse>;
  // terminal MFA step ('totp' or 'totp/confirm'); signs the user in on success
  completeMfaSignIn: (path: MfaLoginStep, body?: Record<string, unknown>) => Promise<void>;
  cancelMfaSignIn: () => void;
  // the pending pass died (typically expired while the user was in their
  // authenticator app): state is discarded and sign-in shows a try-again note
  expireMfaSignIn: () => void;
  mfaSignInExpired: boolean;
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

const Provider = ({
  setToken,
  setRefreshToken,
  setUser,
  setSignedInStatus,
  signedIn,
  children,
  signOutUser,
  navRef,
  ...props
}: PropsWithChildren<AuthProviderProps>): ReactElement => {
  const backend = useContext(BackendContext);
  const checkFirstSession = (): boolean => props.isFirstTime;
  const [user, setUserData] = useState<User>();
  const [settings, setSettings] = useState({});
  const [ability, setAbility] = useState(null);
  const [resetPasswordLastEmailUsed, setResetPasswordLastEmailUsed] = useState('');
  const [preventSignOutOnFailure, setPreventSignOutOnFailure] = useState(false);
  // a sign-in paused for a second factor: the pending state from the server,
  // plus the original connection params (the password is needed again to save
  // the local user once the factor is satisfied)
  const [mfaSignIn, setMfaSignIn] = useState<{
    pending: MfaPending;
    params: SyncConnectionParameters;
  } | null>(null);
  const [mfaSignInExpired, setMfaSignInExpired] = useState(false);

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => props.token !== null && props.user !== null;

  const generateAbilityForUser = (user: User): PureAbility => {
    return buildAbility(user, backend.permissions.data);
  };

  const setContextUserAndAbility = (userData): void => {
    setUserData(userData);
    const abilityObject = generateAbilityForUser(userData);
    setAbility(abilityObject);
  };

  const signInAs = (authenticatedUser): void => {
    // Destructure the local password out of the user object - it only needs to be in
    // the database, we don't need or want to store it in app state as well.
    const userData = { ...authenticatedUser };
    delete userData.password;
    setUser(userData);
    setContextUserAndAbility(userData);
    setSignedInStatus(true);
  };

  const localSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const usr = await backend.auth.localSignIn(params, generateAbilityForUser);
    signInAs(usr);
  };

  const reconnectWithPassword = async (params: ReconnectWithPasswordParameters): Promise<void> => {
    const serverLocation = await readConfig('syncServerLocation');
    const payload = {
      email: user?.email,
      server: serverLocation,
      password: params.password,
    };
    setPreventSignOutOnFailure(true);
    const status = await remoteSignIn(payload);
    if (status === 'mfa') {
      // a reconnect can't drive the MFA screen from here: drop the pending
      // state and ask the user to log in again, which runs the full flow
      setMfaSignIn(null);
      throw new Error('Your account requires a second factor. Please log in again.');
    }
    backend.syncManager.triggerSync();
  };

  const finaliseSignIn = ({ user: usr, settings: stngs, token, refreshToken }): void => {
    setToken(token);
    setSettings(stngs);
    setRefreshToken(refreshToken);
    signInAs(usr);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<'success' | 'mfa'> => {
    const result = await backend.auth.remoteSignIn(params);
    if (result.mfaPending) {
      setMfaSignIn({ pending: result.mfaPending, params });
      return 'mfa';
    }
    finaliseSignIn(result);
    return 'success';
  };

  const signIn = async (params: SyncConnectionParameters): Promise<'success' | 'mfa'> => {
    setMfaSignInExpired(false);
    const network = await NetInfo.fetch();
    let status: 'success' | 'mfa' = 'success';
    if (network.isConnected) {
      status = await remoteSignIn(params);
      if (status === 'mfa') return status;
    } else {
      await localSignIn(params);
    }

    // When user first sign in and has not chosen a facility, don't start the sync service yet
    const facilityId = await readConfig('facilityId', '');
    if (facilityId) {
      backend.syncManager.triggerSync(); // we deliberately don't await this
    }
    return status;
  };

  const beginMfaSignInStep = async (
    path: MfaLoginStep,
    body: Record<string, unknown> = {},
  ): Promise<MfaEnrolResponse> => {
    if (!mfaSignIn) throw new Error('No sign-in is awaiting a second factor');
    return backend.auth.beginMfaSignInStep(mfaSignIn.pending.token, path, body);
  };

  const completeMfaSignIn = async (
    path: MfaLoginStep,
    body: Record<string, unknown> = {},
  ): Promise<void> => {
    if (!mfaSignIn) throw new Error('No sign-in is awaiting a second factor');
    const result = await backend.auth.completeMfaSignIn(
      mfaSignIn.params,
      mfaSignIn.pending.token,
      path,
      body,
    );
    finaliseSignIn(result);
    setMfaSignIn(null);

    const facilityId = await readConfig('facilityId', '');
    if (facilityId) {
      backend.syncManager.triggerSync(); // we deliberately don't await this
    }
  };

  const cancelMfaSignIn = (): void => {
    setMfaSignIn(null);
  };

  const expireMfaSignIn = (): void => {
    setMfaSignIn(null);
    setMfaSignInExpired(true);
  };

  const signOut = (): void => {
    backend.stopSyncService(); // we deliberately don't await this
    signOutUser();
    signOutClient(false);
  };

  // Sign out UI while preserving sync service
  const signOutClient = (signedOutFromInactivity: boolean): void => {
    setSignedInStatus(false);
    const currentRoute = navRef.current?.getCurrentRoute().name;
    const signUpRoutes = [
      Routes.SignUpStack.Index,
      Routes.SignUpStack.Intro,
      Routes.SignUpStack.SignIn,
    ];
    if (!signUpRoutes.includes(currentRoute)) {
      navRef.current?.reset({
        index: 0,
        routes: [
          {
            name: Routes.SignUpStack.Index,
            params: {
              signedOutFromInactivity,
            },
          },
        ],
      });
    }
  };

  const requestResetPassword = async (params: ResetPasswordFormModel): Promise<void> => {
    await backend.auth.requestResetPassword(params);
    setResetPasswordLastEmailUsed(params.email);
  };

  const changePassword = async (params: ChangePasswordFormModel): Promise<void> => {
    await backend.auth.changePassword(params);
  };

  // start a session if there's a stored token
  useEffect(() => {
    if (props.token && props.user) {
      backend.auth.startSession(props.token, props.refreshToken);
    } else {
      backend.auth.endSession();
    }
  }, [backend, props.token, props.user]);

  // sets state again after launching the app
  useEffect(() => {
    if (props.token && props.user) {
      setContextUserAndAbility(props.user);
    }
  }, []);

  // Sign user out if an auth error was thrown
  // except if user is trying to reconnect with password from modal interface
  useEffect(() => {
    const errHandler = (): void => {
      if (preventSignOutOnFailure) {
        // reset flag to prevent sign out being
        // skipped on subsequent failed authentications
        setPreventSignOutOnFailure(true);
      } else {
        signOut();
      }
    };
    backend.auth.emitter.on('authError', errHandler);
    return () => {
      backend.auth.emitter.off('authError', errHandler);
    };
  }, [backend, props.token, preventSignOutOnFailure]);

  return (
    <AuthContext.Provider
      value={{
        setUserFirstSignIn,
        signIn,
        mfaPending: mfaSignIn?.pending ?? null,
        beginMfaSignInStep,
        completeMfaSignIn,
        cancelMfaSignIn,
        expireMfaSignIn,
        mfaSignInExpired,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = compose(withAuth)(Provider);
export const useAuth = (): AuthContextData => useContext(AuthContext);
export default AuthContext;
