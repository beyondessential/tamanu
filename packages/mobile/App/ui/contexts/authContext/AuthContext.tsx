import React, { createContext, PropsWithChildren, ReactElement, useContext, useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { compose } from 'redux';
import { withAuth } from '../../containers/Auth';
import { WithAuthStoreProps } from '/store/ducks/auth';
import { RequestFailedError } from '/infra/httpClient/axios/errors/request-failed-error';
import { IUser } from '~/types/IUser';
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

import { compare, hash } from './bcrypt';

interface AuthContextData {
  signIn: (params: SyncConnectionParameters) => Promise<void>;
  signOut: (navigation: NavigationProp<any>) => void;
  isUserAuthenticated: () => boolean;
  setUserFirstSignIn: () => void;
  checkFirstSession: () => boolean;
  resumeSession: () => void;
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

  // TODO: use server-provided facility
  const dummyFacility = { name: 'BES Clinic', id: '123' };

  const backend = useContext(BackendContext);
  const localSignIn = async ({ email, password }: SyncConnectionParameters): Promise<void> => {
    console.log("Signing in locally as", email);
    const user = await backend.models.User.getRepository().findOne({
      email,
    });

    if (!user || !await compare(password, user.localPassword)) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    setUser({ facility: dummyFacility, ...user });
    setSignedInStatus(true);
  };

  const saveLocalUser = async (userData: Partial<IUser>, password: string): Promise<void> => {
    // save local password to repo for later use
    const userRepo = await backend.models.User.getRepository();
    const dbUser = userRepo.create(userData);
    const savedUser = await userRepo.save(dbUser);

    // kick off a local password hash & save
    // the hash takes a while on mobile, but we don't need to do anything with the result
    // of this until next login, so just start the process without awaiting it
    (async () => {
      savedUser.localPassword = await hash(password);
      await userRepo.save(savedUser);
      console.log(`Set local password for ${savedUser.email}`);
    })();

    // return the user that was saved to the database
    return savedUser;
  };

  const remoteSignIn = async (params: SyncConnectionParameters): Promise<void> => {
    const { user, token } = await backend.connectToRemote(params);

    // kick off a local save
    const userData = await saveLocalUser(user, params.password);

    setUser({ facility: dummyFacility, ...userData });
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

  const signOut = (navigation: NavigationProp<any>): void => {
    backend.stopSyncService();
    signOutUser();
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.SignUpStack.Index }],
    });
  };

  const resumeSession = (): void => {
    backend.startSyncService();
  };

  return (
    <AuthContext.Provider
      value={{
        setUserFirstSignIn,
        signIn,
        signOut,
        isUserAuthenticated,
        checkFirstSession,
        resumeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = compose(withAuth)(Provider);
export default AuthContext;
