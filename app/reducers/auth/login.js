import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILED,
  AUTH_LOGOUT,
} from '../../actions/types';

export default {
  [AUTH_LOGIN_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [AUTH_LOGIN_SUCCESS]: ({
    userId,
    displayName,
    email,
    secret,
    permissions
   }, state) => ({
    ...state,
    userId,
    displayName,
    email,
    secret,
    permissions,
    loading: false
  }),
  [AUTH_LOGIN_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [AUTH_LOGOUT]: (_, state) => ({
    ...state,
    userId: null,
    displayName: '',
    secret: '',
    loading: false
  }),
};
