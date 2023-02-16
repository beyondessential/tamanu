import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CentralConnectionStatus, IUser } from '~/types';

export type WithAuthStoreProps = WithAuthActions & AuthStateProps;
export interface WithAuthActions {
  setUser: (payload: IUser) => PayloadAction<IUser>;
  setToken: (payload: string) =>
  PayloadAction<string>;
  setRefreshToken: (payload: string) => PayloadAction<string>;
  setFirstSignIn: (value: boolean) => PayloadAction<boolean>;
  setSignedInStatus: (payload: boolean) => PayloadAction<boolean>;
  setCentralConnectionStatus: (
    payload: CentralConnectionStatus,
  ) => PayloadAction<CentralConnectionStatus>;
  signOutUser(): () => PayloadAction<void>;
}

export interface AuthStateProps {
  token: string;
  refreshToken: string;
  user: IUser;
  signedIn: boolean;
  isFirstTime: boolean;
  centralConnectionStatus: CentralConnectionStatus;
}

const initialState: AuthStateProps = {
  token: null,
  refreshToken: null,
  user: null,
  signedIn: false,
  isFirstTime: true,
  centralConnectionStatus: CentralConnectionStatus.Disconnected,
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
    signOutUser(state): AuthStateProps {
      return {
        ...state,
        token: null,
        refreshToken: null,
      };
    },
    setCentralConnectionStatus(
      state,
      { payload: centralConnectionStatus }: PayloadAction<CentralConnectionStatus>,
    ): AuthStateProps {
      return {
        ...state,
        centralConnectionStatus,
      };
    },
  },
});

export const actions = PatientSlice.actions;
export const authReducer = PatientSlice.reducer;
