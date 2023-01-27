import React, {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useState,
  RefObject,
} from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { PureAbility } from '@casl/ability';
import { readConfig } from '~/services/config';
import { withAuth } from '~/ui/containers/Auth';
import { CentralServerConnectionStatus, WithAuthStoreProps } from '~/ui/store/ducks/auth';
import { Routes } from '~/ui/helpers/routes';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { IUser, SyncConnectionParameters } from '~/types';
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
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: () => void;
  reconnectWithPassword: (params: { password: string }) => Promise<void>;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
  setCentralServerConnectionStatus: (status: CentralServerConnectionStatus) => void;
  checkFirstSession: () => boolean;
  requestResetPassword: (params: ResetPasswordFormModel) => void;
  resetPasswordLastEmailUsed: string;
  changePassword: (params: ChangePasswordFormModel) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const Provider = ({
  setToken,
  setUser,
  setSignedInStatus,
  setCentralServerConnectionStatus,
  children,
  signOutUser,
  navRef,
  ...props
}: PropsWithChildren<AuthProviderProps>): ReactElement => {
  const backend = useContext(BackendContext);
  const checkFirstSession = (): boolean => props.isFirstTime;
  const [user, setUserData] = useState<User>();
  const [ability, setAbility] = useState(null);
  const [resetPasswordLastEmailUsed, setResetPasswordLastEmailUsed] = useState('');
  const [preventSignOutOnFailure, setPreventSignOutOnFailure] = useState(false);

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => props.token !== null && props.user !== null;

  const setContextUserAndAbility = (userData): void => {
    setUserData(userData);
    const abilityObject = buildAbility(userData, backend.permissions.data);
    setAbility(abilityObject);
  };

  const signInAs = (authenticatedUser): void => {
    // Destructure the local password out of the user object - it only needs to be in
    // the database, we don't need or want to store it in app state as well.
    const { localPassword, ...userData } = authenticatedUser;
    setUser(userData);
    setContextUserAndAbility(userData);
    setSignedInStatus(true);
  };

  const localSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const usr = await backend.auth.localSignIn(params);
    signInAs(usr);
  };

  const reconnectWithPassword = async (params: { password: string }): Promise<void> => {
    const serverLocation = await readConfig('syncServerLocation');
    const payload = {
      email: user?.email,
      server: serverLocation,
      password: params.password,
    };
    setPreventSignOutOnFailure(true);

    await backend.auth.remoteSignIn(payload);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user: usr, token } = await backend.auth.remoteSignIn(params);
    setToken(token);
    signInAs(usr);
  };

  const signIn = async (params: SyncConnectionParameters): Promise<void> => {
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
  };

  const signOut = (): void => {
    backend.stopSyncService(); // we deliberately don't await this
    signOutUser();
    const currentRoute = navRef.current?.getCurrentRoute().name;
    const signUpRoutes = [
      Routes.SignUpStack.Index,
      Routes.SignUpStack.Intro,
      Routes.SignUpStack.SignIn,
    ];
    if (!signUpRoutes.includes(currentRoute)) {
      navRef.current?.reset({
        index: 0,
        routes: [{ name: Routes.SignUpStack.Index }],
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
      setCentralServerConnectionStatus(CentralServerConnectionStatus.Connected);
      backend.auth.startSession(props.token);
    } else {
      setCentralServerConnectionStatus(CentralServerConnectionStatus.Disconnected);
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
    const errHandler = (err: Error): void => {
      if (!preventSignOutOnFailure) {
        signOut();
      } else {
        setPreventSignOutOnFailure(true);
      }
    };
    const centralStatusChangeHandler = (status: CentralServerConnectionStatus) => {
      setCentralServerConnectionStatus(status)
    }
    backend.auth.emitter.on('authError', errHandler);
    backend.auth.emitter.on('centralConnectionStatusChange', centralStatusChangeHandler)
    return () => {
      backend.auth.emitter.off('authError', errHandler);
      backend.auth.emitter.off('centralConnectionStatusChange', centralStatusChangeHandler)
    };
  }, [backend, props.token, preventSignOutOnFailure]);

  return (
    <AuthContext.Provider
      value={{
        setUserFirstSignIn,
        setCentralServerConnectionStatus,
        signIn,
        signOut,
        reconnectWithPassword,
        isUserAuthenticated,
        checkFirstSession,
        user,
        ability,
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
