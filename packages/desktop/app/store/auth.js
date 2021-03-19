import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';
import { LOCAL_STORAGE_KEYS } from '../constants';

// actions
const LOGIN_START = 'LOGIN_START';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const LOGOUT = 'LOGOUT';
const LOGOUT_WITH_ERROR = 'LOGOUT_WITH_ERROR';

export const login = (host, email, password) => async (dispatch, getState, { api }) => {
  dispatch({ type: LOGIN_START });

  try {
    const { user, token } = await api.login(host, email, password);
    dispatch({ type: LOGIN_SUCCESS, user, token });
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, error: error.message });
  }
};

export const authFailure = () => async dispatch => {
  dispatch({
    type: LOGOUT_WITH_ERROR,
    error: 'Your session has expired. Please log in again.',
  });
};

export const versionIncompatible = message => async dispatch => {
  dispatch({
    type: LOGOUT_WITH_ERROR,
    error: message,
  });
};

export const logout = () => ({
  type: LOGOUT,
});

// selectors
export const getCurrentUser = ({ auth }) => auth.user;
export const checkIsLoggedIn = state => !!getCurrentUser(state);

// reducer
const defaultState = {
  loading: false,
  user: null,
  error: null,
};

const actionHandlers = {
  [LOGIN_START]: () => ({
    loading: true,
    user: defaultState.user,
    error: defaultState.error,
  }),
  [LOGIN_SUCCESS]: action => ({
    loading: false,
    user: action.user,
    error: defaultState.error,
    token: action.token,
  }),
  [LOGIN_FAILURE]: action => ({
    loading: false,
    error: action.error,
  }),
  [LOGOUT_WITH_ERROR]: action => ({
    user: defaultState.user,
    error: action.error,
  }),
  [LOGOUT]: () => ({
    user: defaultState.user,
  }),
};

export const authReducer = createStatePreservingReducer(defaultState, actionHandlers);
