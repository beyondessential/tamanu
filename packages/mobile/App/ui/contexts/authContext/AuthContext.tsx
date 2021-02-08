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

  // TODO: use server-provided facility
  const dummyFacility = { name: 'BES Clinic', id: '123' };

  const backend = useContext(BackendContext);
  const localSignIn = async ({ email, password }: SyncConnectionParameters): Promise<void> => {
    const user = await backend.models.User.getRepository().findOne({
      email,
    });

    if (!user || !bcrypt.compare(password, user.localPassword)) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    setUser({ facility: dummyFacility, ...user });
    setSignedInStatus(true);
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user, token } = await backend.connectToRemote(params);

    // TODO: set local password for user
    // const localPassword = await bcrypt.hash(params.password, SALT_ROUNDS);
    // then create or update user in local db with these details

    setUser({ facility: dummyFacility, ...user });
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
