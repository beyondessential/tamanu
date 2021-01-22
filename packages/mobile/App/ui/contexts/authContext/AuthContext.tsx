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

interface AuthContextData {
  signIn: (email: string, password: string) => Promise<void>;
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
  const localSignIn = async (email: string, password: string): Promise<void> => {
    const result = await backend.models.User.getRepository().findOne({
      email,
    });

    if (!result || !bcrypt.compare(password, result.password)) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    setUser(result);
    setSignedInStatus(true);
  };

  const dummyUser = {
    id: 'dummy_user_id',
    email: 'dummy_user_email@beyondessential.com.au',
    localPassword: 'dummy_user_password',
    displayName: 'Dummy User',
    role: 'dummy_role',
    facility: {
      id: 'dummy_facility_id',
      name: 'Dummy Facility',
    },
  };

  const remoteSignIn = async (email: string, password: string): Promise<void> => {
    const { user, token } = await backend.syncSource.login(email, password);

    // merge with dummy user to ensure that all fields are present
    // safe to delete this when the server is responding with full info
    // (specifically facility information)
    setUser({ ...dummyUser, ...user });
    setToken(token);
    setSignedInStatus(true);
  };

  const dummySignIn = (): void => {
    setUser(user);
    setToken('fake-token');
    setSignedInStatus(true);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    // TODO: only allow in dev build
    if(!email && !password) {
      return dummySignIn();
    }

    const network = await NetInfo.fetch();

    if(!network.isConnected) {
      return localSignIn(email, password);
    }

    return remoteSignIn(email, password);
  };

  const signOut = (navigation: NavigationProp<any>): void => {
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
