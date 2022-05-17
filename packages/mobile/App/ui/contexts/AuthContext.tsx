import React, { createContext, PropsWithChildren, ReactElement, useContext, useEffect, useState, RefObject } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { withAuth } from '~/ui/containers/Auth';
import { WithAuthStoreProps } from '~/ui/store/ducks/auth';
import { Routes } from '~/ui/helpers/routes';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { IUser, SyncConnectionParameters } from '~/types';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { ResetPasswordFormModel } from '/interfaces/forms/ResetPasswordFormProps';
import {ChangePasswordFormModel} from "/interfaces/forms/ChangePasswordFormProps";

type AuthProviderProps = WithAuthStoreProps & {
  navRef: RefObject<NavigationContainerRef>;
}

interface AuthContextData {
  user: IUser;
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: () => void;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
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
  children,
  signOutUser,
  navRef,
  ...props
}: PropsWithChildren<AuthProviderProps>): ReactElement => {
  const checkFirstSession = (): boolean => props.isFirstTime;
  const [user, setUserData] = useState();
  const [resetPasswordLastEmailUsed, setResetPasswordLastEmailUsed] = useState('');

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => props.token !== null && props.user !== null;

  const signInAs = (user) => {
    // Destructure the local password out of the user object - it only needs to be in
    // the database, we don't need or want to store it in app state as well.
    const { localPassword, ...userData } = user;
    setUser(userData);
    setUserData(userData);
    setSignedInStatus(true);
  };

  const backend = useContext(BackendContext);
  const localSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const user = await backend.auth.localSignIn(params);
    signInAs(user);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user, token } = await backend.auth.remoteSignIn(params);
    setToken(token);
    signInAs(user);
  };

  const signIn = async (params: SyncConnectionParameters): Promise<void> => {
    const network = await NetInfo.fetch();
    if (network.isConnected) {
      await remoteSignIn(params);
    } else {
      await localSignIn(params);
    }
    backend.startSyncService(); // we deliberately don't await this
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
      backend.auth.startSession(props.token);
    } else {
      backend.auth.endSession();
    }
  }, [backend, props.token, props.user]);

  // sign user out if an auth error was thrown
  useEffect(() => {
    const handler = (err: Error) => {
      console.log(`signing out user with token ${props.token}: received auth error:`, err);
      signOut();
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
        user,
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
export default AuthContext;
