import { createReducer } from '../utils/createReducer';

// actions
const LOGIN_START = 'LOGIN_START';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const LOGOUT = 'LOGOUT';
const TOKEN_REJECTION = 'TOKEN_REJECTION';

export const login = (email, password) => async (dispatch, getState, { api }) => {
  dispatch({ type: LOGIN_START });

  try {
    const { user, token } = await api.login(email, password);
    dispatch({ type: LOGIN_SUCCESS, user, token });
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, error: error.message });
  }
};

export const authFailure = () => async dispatch => {
  dispatch({
    type: TOKEN_REJECTION,
    error: 'Your session has expired. Please log in again.',
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
  [TOKEN_REJECTION]: action => ({
    user: defaultState.user,
    error: action.error,
  }),
  [LOGOUT]: () => ({
    user: defaultState.user,
  }),
};

export const authReducer = createReducer(defaultState, actionHandlers);
