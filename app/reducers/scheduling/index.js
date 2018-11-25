import { has } from 'lodash';
import appointment from './appointment';
import appointments from './appointments';

const stateChanges = { ...appointment, ...appointments };
const initialState = {
  appointment: {},
  appointments: [],
  loading: false,
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
