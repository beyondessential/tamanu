import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '~/types';

export type WithAuthStoreProps = WithAuthActions & AuthStateProps;
export interface WithAuthActions {
  setUser: (payload: IUser) => PayloadAction<IUser>;
  setToken: (payload: {token: string, expiresAt: number}) =>
  PayloadAction<{token: string, expiresAt: number}>;
  setRefreshToken: (payload: string) => PayloadAction<string>;
  setFirstSignIn: (value: boolean) => PayloadAction<boolean>;
  setSignedInStatus: (payload: boolean) => PayloadAction<boolean>;
  signOutUser(): () => PayloadAction<void>;
}

export interface AuthStateProps {
  token: string;
  expiresAt: number;
  refreshToken: string;
  user: IUser;
  signedIn: boolean;
  isFirstTime: boolean;
}

const initialState: AuthStateProps = {
  token: null,
  expiresAt: null,
  refreshToken: null,
  user: null,
  signedIn: false,
  isFirstTime: true,
};

export const PatientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setToken(state, { payload: { token, expiresAt } }:
    PayloadAction<{token: string, expiresAt: number}>): AuthStateProps {
      return {
        ...state,
        token,
        expiresAt,
      };
    },
    setRefreshToken(state, { payload: refreshToken }: PayloadAction<string>): AuthStateProps {
      return {
        ...state,
        refreshToken,
      };
    },
    setSignedInStatus(
      state,
      { payload: signInStatus }: PayloadAction<boolean>,
    ): AuthStateProps {
      return {
        ...state,
        signedIn: signInStatus,
      };
    },
    setFirstSignIn(
      state,
      { payload: firstSignIn }: PayloadAction<boolean>,
    ): AuthStateProps {
      return {
        ...state,
        isFirstTime: firstSignIn,
      };
    },
    setUser(
      state,
      { payload: user }: PayloadAction<IUser>,
    ): AuthStateProps {
      return {
        ...state,
        user,
      };
    },
    signOutUser(state): AuthStateProps {
      return {
        ...state,
        token: null,
        refreshToken: null,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const authReducer = PatientSlice.reducer;
