import { createReducer } from '../utils/createReducer';
import { LOGIN, LOGOUT } from './authActions';

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
