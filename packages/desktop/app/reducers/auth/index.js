import { has } from 'lodash';
import login from './login';

const stateChanges = { ...login };
const initialState = {
  userId: null,
  hospitalId: null,
  displayName: '',
  email: '',
  secret: '',
  abilities: {},
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
