import { createReducer } from '../utils/createReducer';

// actions
const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';

export const login = () => ({
  type: LOGIN,
});

export const logout = () => ({
  type: LOGOUT,
});

// selectors
export const getCurrentUser = ({ auth }) => auth.user;
export const checkIsLoggedIn = state => !!getCurrentUser(state);

// reducer
const defaultState = {
  user: null,
};

const actionHandlers = {
  [LOGIN]: () => ({
    user: 'edwin',
  }),
  [LOGOUT]: () => ({
    user: defaultState.user,
  }),
};

export const authReducer = createReducer(defaultState, actionHandlers);
