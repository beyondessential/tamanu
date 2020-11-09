import React, { createContext, PropsWithChildren, ReactElement, useContext, useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
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

    if (!result || password !== result.localPassword) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    setUser(result);
    setSignedInStatus(true);
  };

  const remoteSignIn = async (email: string, password: string): Promise<void> => {
    const { user, token } = await backend.syncSource.login(email, password);

    setUser(user);
    setToken(token);
    setSignedInStatus(true);
  };

  const dummySignIn = (): void => {
    const user = {
      id: '1SYEd1SeabMJ5ibw',
      email: 'test@beyondessential.com.au',
      localPassword: '123',
      displayName: 'Chris Fletcher',
      role: 'practitioner',
      facility: {
        id: '12312',
        name: 'Victoria Hospital',
      },
    };

    setUser(user);
    setSignedInStatus(true);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    // const network = await NetInfo.fetch();

    dummySignIn();

    // try {
    //   localSignIn(email, password);
    //   if (network.isConnected) remoteSignIn(email, password);
    // } catch (error) {
    //   return error;
    // }
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
