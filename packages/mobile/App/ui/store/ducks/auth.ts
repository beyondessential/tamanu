import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '~/types';

export type WithAuthStoreProps = WithAuthActions & AuthStateProps;
export interface WithAuthActions {
  setUser: (payload: IUser) => PayloadAction<IUser>;
  setToken: (payload: string) =>
  PayloadAction<string>;
  setRefreshToken: (payload: string) => PayloadAction<string>;
  setFirstSignIn: (value: boolean) => PayloadAction<boolean>;
  setSignedInStatus: (payload: boolean) => PayloadAction<boolean>;
  setCountryTimeZone: (payload: string) => PayloadAction<string>;
  signOutUser(): () => PayloadAction<void>;
}

export interface AuthStateProps {
  token: string;
  refreshToken: string;
  user: IUser;
  signedIn: boolean;
  isFirstTime: boolean;
  countryTimeZone: string;
}

const initialState: AuthStateProps = {
  token: null,
  refreshToken: null,
  user: null,
  signedIn: false,
  isFirstTime: true,
  countryTimeZone: '',
};

export const PatientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setToken(state, { payload: token }:
    PayloadAction<string>): AuthStateProps {
      return {
        ...state,
        token,
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
    setFirstSignIn(state, { payload: firstSignIn }: PayloadAction<boolean>): AuthStateProps {
      return {
        ...state,
        isFirstTime: firstSignIn,
      };
    },
    setUser(state, { payload: user }: PayloadAction<IUser>): AuthStateProps {
      return {
        ...state,
        user,
      };
    },
    setCountryTimeZone(state, { payload: countryTimeZone }: PayloadAction<string>): AuthStateProps {
      return {
        ...state,
        countryTimeZone,
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
