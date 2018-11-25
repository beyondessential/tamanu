import { has } from 'lodash';
import login from './login';

const stateChanges = { ...login };
const initialState = {
  userId: null,
  displayName: '',
  email: '',
  secret: '',
  permissions: {},
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
