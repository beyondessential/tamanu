import React, { createContext, PropsWithChildren, ReactElement, useContext, useEffect } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { withAuth } from '/containers/Auth';
import { WithAuthStoreProps } from '/store/ducks/auth';
import { Routes } from '/helpers/routes';
import { BackendContext } from '/contexts/BackendContext';
import { SyncConnectionParameters } from '~/types';

type AuthProviderProps = WithAuthStoreProps & {
  navRef: NavigationContainerRef;
}

interface AuthContextData {
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: () => void;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
  checkFirstSession: () => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const Provider = ({
  setToken,
  setUser,
  setSignedInStatus,
  children,
  signOutUser,
  navRef,
  ...props
}: PropsWithChildren<AuthProviderProps>): ReactElement => {
  const checkFirstSession = (): boolean => props.isFirstTime;

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => props.token !== null && props.user !== null;

  // TODO: use server-provided facility
  const dummyFacility = { name: 'BES Clinic', id: '123' };

  const backend = useContext(BackendContext);
  const localSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const user = await backend.auth.localSignIn(params);
    setUser({ facility: dummyFacility, ...user });
    setSignedInStatus(true);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user, token } = await backend.auth.remoteSignIn(params);
    setUser({ facility: dummyFacility, ...user });
    setToken(token);
    setSignedInStatus(true);
  };

  const signIn = async (params: SyncConnectionParameters): Promise<void> => {
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      return localSignIn(params);
    }
    return remoteSignIn(params);
  };

  const signOut = (): void => {
    backend.stopSyncService();
    signOutUser();
    navRef?.reset({
      index: 0,
      routes: [{ name: Routes.SignUpStack.Index }],
    });
  };

  // start a session if there's a stored token
  useEffect(() => {
    if (props.token && props.user) {
      backend.auth.startSession(props.token);
    } else {
      backend.auth.endSession();
    }
  }, [backend, props.token, props.user]);

  // sign user out if there was a token but an auth error was thrown
  useEffect(() => {
    const handler = (err: Error) => {
      if (props.token) {
        console.log(`signing out user with token ${props.token}: recieved auth error:`, err);
        signOut();
      }
    };
    backend.auth.emitter.on('authError', handler);
    return () => {
      backend.auth.emitter.off('authError', handler);
    };
  }, [backend, props.token]);

  return (
    <AuthContext.Provider
      value={{
        setUserFirstSignIn,
        signIn,
        signOut,
        isUserAuthenticated,
        checkFirstSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = compose(withAuth)(Provider);
export default AuthContext;
