import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILED,
  AUTH_LOGOUT,
} from '../../actions/types';

export default {
  [AUTH_LOGIN_REQUEST]: (_, state) => ({
    ...state,
    loading: true,
  }),
  [AUTH_LOGIN_SUCCESS]: ({
    userId,
    hospitalId,
    displayName,
    email,
    secret,
    abilities,
  }, state) => ({
    ...state,
    userId,
    hospitalId,
    displayName,
    email,
    secret,
    abilities,
    loading: false,
  }),
  [AUTH_LOGIN_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false,
  }),
  [AUTH_LOGOUT]: (_, state) => ({
    ...state,
    userId: null,
    hospitalId: null,
    displayName: '',
    email: '',
    secret: null,
    abilities: {},
    loading: false,
  }),
};
