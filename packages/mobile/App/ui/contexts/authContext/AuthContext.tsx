import React, { createContext, PropsWithChildren, ReactElement, useContext, useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
import bcrypt from 'react-native-bcrypt';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { withAuth } from '../../containers/Auth';
import { WithAuthStoreProps } from '/store/ducks/auth';
import { RequestFailedError } from '/infra/httpClient/axios/errors/request-failed-error';
import {
  InvalidCredentialsError,
  AuthenticationError,
  noServerAccessMessage,
  invalidUserCredentialsMessage,
  generalErrorMessage,
} from './auth-error';
import { Routes } from '/helpers/routes';
import { BackendContext } from '~/services/backendProvider';
import { SyncConnectionParameters } from '~/types/SyncConnectionParameters';

interface AuthContextData {
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: (navigation: NavigationProp<any>) => void;
  checkPreviousUserAuthentication: (navigation: NavigationProp<any>) => void;
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
  ...props
}: PropsWithChildren<WithAuthStoreProps>): ReactElement => {
  const checkFirstSession = (): boolean => props.isFirstTime;

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => props.token !== null && props.user !== null;

  const checkPreviousUserAuthentication = (
    navigation: NavigationProp<any>,
  ): void => {
    if (isUserAuthenticated()) {
      navigation.navigate(Routes.HomeStack.Index, {
        screen: Routes.HomeStack.HomeTabs.Index,
        params: {
          screen: Routes.HomeStack.HomeTabs.Home,
        },
      });
    } else {
      navigation.navigate(Routes.SignUpStack.Index);
    }
  };

  const backend = useContext(BackendContext);
  const localSignIn = async ({ email, password }: SyncConnectionParameters): Promise<void> => {
    const result = await backend.models.User.getRepository().findOne({
      email,
    });

    if (!result || !bcrypt.compare(password, result.password)) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    setUser(result);
    setSignedInStatus(true);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user, token } = await backend.connectToRemote(params);

    setUser(user);
    setToken(token);
    setSignedInStatus(true);
  };

  const signIn = async (params: SyncConnectionParameters): Promise<void> => {
    const network = await NetInfo.fetch();

    if(!network.isConnected) {
      return localSignIn(params);
    }

    return remoteSignIn(params);
  };

  const signOut = (navigation: NavigationProp<any>): void => {
    backend.stopSyncService();
    signOutUser();
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.SignUpStack.Index }],
    });
  };

  return (
    <AuthContext.Provider
      value={{
        setUserFirstSignIn,
        signIn,
        checkPreviousUserAuthentication,
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
