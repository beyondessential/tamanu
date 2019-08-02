import { createReducer } from '../utils/createReducer';
import { LOGIN, LOGOUT } from './actions';

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

export const reducer = createReducer(defaultState, actionHandlers);
