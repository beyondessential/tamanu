import React, {createContext, PropsWithChildren, ReactElement} from 'react';
import {NavigationProp} from '@react-navigation/native';
import {compose} from 'redux';
import {withAuth} from '../../containers/Auth';
import {WithAuthStoreProps} from '/store/ducks/auth';
import {RequestFailedError} from '/infra/httpClient/axios/errors/request-failed-error';
import {
  InvalidCredentialsError,
  AuthenticationError,
  noServerAccessMessage,
  invalidUserCredentialsMessage,
  generalErrorMessage,
} from './auth-error';
import {Routes} from '/helpers/routes';

interface AuthContextData {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (navigation: NavigationProp<any>) => void;
  checkPreviousUserAuthentication: (navigation: NavigationProp<any>) => void;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
  checkFirstSession: () => boolean;
}

const makeUserSignInController = () => ({
  handle: async ({ email, password }) => ({
    token: `token-${Math.random()}`
  }),
});

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const Provider = ({
  setToken,
  children,
  signOutUser,
  ...props
}: PropsWithChildren<WithAuthStoreProps>): ReactElement => {
  const checkFirstSession = () => {
    return props.isFirstTime;
  };

  const setUserFirstSignIn = (): void => {
    props.setFirstSignIn(false);
  };

  const isUserAuthenticated = (): boolean => {
    return props.token !== null && props.user !== null;
  };

  const checkPreviousUserAuthentication = (
    navigation: NavigationProp<any>,
  ): void => {
    if (isUserAuthenticated()) {
      navigation.navigate(Routes.HomeStack.name, {
        screen: Routes.HomeStack.HomeTabs.name,
        params: {
          screen: Routes.HomeStack.HomeTabs.Home,
        },
      });
    } else {
      navigation.navigate(Routes.SignUpStack.name);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const signInController = makeUserSignInController();
    const result = await signInController.handle({email, password});
    if (result.data) {
      setToken(result.data);
    } else if (result.error) {
      switch (result.error.constructor) {
        case RequestFailedError:
          throw new AuthenticationError(noServerAccessMessage);
        case InvalidCredentialsError:
          throw new AuthenticationError(invalidUserCredentialsMessage);
        default:
          throw new AuthenticationError(generalErrorMessage);
      }
    }
  };

  const signOut = (navigation: NavigationProp<any>): void => {
    signOutUser();
    navigation.reset({
      index: 0,
      routes: [{name: Routes.SignUpStack.name}],
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
